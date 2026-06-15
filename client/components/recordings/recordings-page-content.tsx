"use client";

import { listRecordings } from "@/app/recordings/api/recordings-api";
import type { StandaloneRecording } from "@/app/recordings/types";
import { RecordingResultCard } from "@/components/recordings/recording-result-card";
import {
  type RecordingPageAction,
  useRecordingPageAction,
} from "@/components/recordings/use-recording-page-action";
import { VoiceRecorderCard } from "@/components/recordings/voice-recorder-card";
import { formatUserError, displayUserError } from "@/lib/errors/format-user-error";
import {
  buildMockStandupRecordingSearchSuggestions,
  buildStandupStorySearchSuggestions,
  prependMockStandupRecordings,
} from "@/lib/meetings/mock-standup-story";
import { filterRecordingsBySearch } from "@/lib/search/filter-recordings";
import { buildRecordingSearchSuggestions } from "@/lib/search/build-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function RecordingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recordings, setRecordings] = useState<StandaloneRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageAction, setPageAction] = useState<RecordingPageAction | null>(null);
  const { query } = useDashboardSearch();

  const actionParam = searchParams.get("action");

  useEffect(() => {
    if (actionParam === "record" || actionParam === "upload") {
      setPageAction(actionParam);
    }
  }, [actionParam]);

  const clearPageAction = useCallback(() => {
    setPageAction(null);
    if (actionParam) {
      router.replace("/recordings");
    }
  }, [actionParam, router]);

  useRecordingPageAction({
    action: pageAction,
    ready: !isLoading,
    onHandled: clearPageAction,
  });

  const filteredRecordings = useMemo(
    () => filterRecordingsBySearch(recordings, query),
    [recordings, query],
  );

  const recordingSuggestions = useMemo(() => {
    const fromRecordings = buildRecordingSearchSuggestions(recordings);
    const fromStory = buildStandupStorySearchSuggestions().filter(
      (suggestion) => suggestion.category !== "Meeting",
    );
    const fromMockRecordings = buildMockStandupRecordingSearchSuggestions().filter(
      (suggestion) => !fromRecordings.some((item) => item.id === suggestion.id),
    );
    return [...fromStory, ...fromMockRecordings, ...fromRecordings];
  }, [recordings]);
  useRegisterSearchSuggestions("recordings-list", recordingSuggestions);

  const loadRecordings = useCallback(async () => {
    try {
      const response = await listRecordings();
      setRecordings(prependMockStandupRecordings(response.recordings));
      setError("");
    } catch (caughtError) {
      setRecordings(prependMockStandupRecordings([]));
      setError(formatUserError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {displayUserError(error)}
        </p>
      ) : null}

      <VoiceRecorderCard
        onUploaded={() => void loadRecordings()}
        openRecordSetup={actionParam === "record" || pageAction === "record"}
      />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {filteredRecordings.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredRecordings.map((recording) => (
                <RecordingResultCard
                  key={recording.id}
                  recording={recording}
                  onDeleted={() => void loadRecordings()}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="font-medium text-foreground">No matching recordings</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
