"use client";

import { SummarySectionsGrid } from "@/components/summary/summary-sections-grid";
import { MeetingDetailTopbar } from "@/components/meetings/detail/meeting-detail-topbar";
import { useToast } from "@/components/ui/toast";
import {
  getMockStandupGoogleDocUrl,
  isMockStandupMeeting,
  MOCK_STANDUP_STORY_GOOGLE_DOC_URL,
} from "@/lib/meetings/mock-standup-story";
import { buildGoogleDocsContent } from "@/lib/summary/build-google-docs-content";
import type { StandupDocTab } from "@/lib/summary/build-full-mock-standup-google-docs-content";
import { openGoogleDocUrl, openInGoogleDocs } from "@/lib/summary/open-in-google-docs";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { useCallback, useMemo, useState } from "react";

type GoogleDocsContentInput = {
  title: string;
  createdDate: string | null;
  durationLabel: string | null;
  participants: SummaryParticipant[];
  topics: string[];
  notes: SummaryNoteItem[];
};

type MeetingSummaryViewProps = {
  meetingId: string;
  initialTitle: string;
  createdDate: string | null;
  durationLabel: string | null;
  participants: SummaryParticipant[];
  initialTopics: string[];
  initialNotes: SummaryNoteItem[];
  buildGoogleDocsContent?: (input: GoogleDocsContentInput) => string;
  standupDocTabs?: StandupDocTab[];
  googleDocUrl?: string | null;
};

export function MeetingSummaryView({
  meetingId,
  initialTitle,
  createdDate,
  durationLabel,
  participants,
  initialTopics,
  initialNotes,
  buildGoogleDocsContent: buildGoogleDocsContentOverride,
  standupDocTabs,
  googleDocUrl,
}: MeetingSummaryViewProps) {
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [topics, setTopics] = useState(initialTopics);
  const [notes, setNotes] = useState(initialNotes);

  const resolvedGoogleDocUrl = useMemo(() => {
    if (googleDocUrl?.trim()) {
      return googleDocUrl.trim();
    }

    if (isMockStandupMeeting(meetingId)) {
      return getMockStandupGoogleDocUrl(meetingId);
    }

    if (standupDocTabs?.length) {
      return MOCK_STANDUP_STORY_GOOGLE_DOC_URL;
    }

    return null;
  }, [googleDocUrl, meetingId, standupDocTabs]);

  const handleOpenGoogleDocs = useCallback(async () => {
    if (resolvedGoogleDocUrl) {
      return;
    }

    const content = buildGoogleDocsContentOverride
      ? buildGoogleDocsContentOverride({
          title,
          createdDate,
          durationLabel,
          participants,
          topics,
          notes,
        })
      : buildGoogleDocsContent({
          title,
          createdDate,
          durationLabel,
          participants,
          topics,
          notes,
        });

    try {
      await openInGoogleDocs(content);
      toast.add({
        title: "Opened Google Docs",
        description: "Your summary was copied. Paste it into the new document with Cmd+V.",
        type: "success",
      });
    } catch {
      openGoogleDocUrl("https://docs.google.com/document/create");
      toast.add({
        title: "Could not copy automatically",
        description: "A new Google Doc was opened. Copy your summary manually if needed.",
        type: "info",
      });
    }
  }, [
    buildGoogleDocsContentOverride,
    createdDate,
    durationLabel,
    notes,
    participants,
    resolvedGoogleDocUrl,
    title,
    toast,
    topics,
  ]);

  const handleStartEditTitle = useCallback(() => {
    setIsEditingTitle(true);
  }, []);

  const handleFinishEditTitle = useCallback(() => {
    setTitle((value) => value.trim() || initialTitle);
    setIsEditingTitle(false);
  }, [initialTitle]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <MeetingDetailTopbar
        meetingId={meetingId}
        title={title}
        createdDate={createdDate}
        durationLabel={durationLabel}
        transcript={null}
        audioUrl={null}
        roomName={null}
        summaryView
        isEditingTitle={isEditingTitle}
        onTitleChange={setTitle}
        onStartEditTitle={handleStartEditTitle}
        onFinishEditTitle={handleFinishEditTitle}
        googleDocUrl={resolvedGoogleDocUrl}
        onOpenGoogleDocs={
          resolvedGoogleDocUrl ? undefined : () => void handleOpenGoogleDocs()
        }
      />

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-none lg:px-6">
        <SummarySectionsGrid
          participants={participants}
          topics={topics}
          onTopicsChange={setTopics}
          notes={notes}
          onNotesChange={setNotes}
        />
      </div>
    </div>
  );
}
