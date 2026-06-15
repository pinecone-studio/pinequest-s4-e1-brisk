"use client";

import { listRecordings } from "@/app/recordings/api/recordings-api";
import type { StandaloneRecording } from "@/app/recordings/types";
import { RecordingDropzone } from "@/components/recordings/recording-dropzone";
import { RecordingResultCard } from "@/components/recordings/recording-result-card";
import { VoiceRecorderCard } from "@/components/recordings/voice-recorder-card";
import { formatUserError } from "@/lib/errors/format-user-error";
import { filterRecordingsBySearch } from "@/lib/search/filter-recordings";
import { buildRecordingSearchSuggestions } from "@/lib/search/build-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<StandaloneRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { query } = useDashboardSearch();

  const filteredRecordings = useMemo(
    () => filterRecordingsBySearch(recordings, query),
    [recordings, query],
  );

  const recordingSuggestions = useMemo(
    () => buildRecordingSearchSuggestions(recordings),
    [recordings],
  );
  useRegisterSearchSuggestions("recordings-list", recordingSuggestions);

  const loadRecordings = useCallback(async () => {
    try {
      const response = await listRecordings();
      setRecordings(response.recordings);
      setError("");
    } catch (caughtError) {
      setError(formatUserError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : recordings.length > 0 ? (
        <>
          <VoiceRecorderCard onUploaded={() => void loadRecordings()} />
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
      ) : (
        <RecordingDropzone onUploaded={() => void loadRecordings()} />
      )}
    </div>
  );
}
