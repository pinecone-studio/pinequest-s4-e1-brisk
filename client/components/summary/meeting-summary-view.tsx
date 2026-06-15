"use client";

import { SummarySectionsGrid } from "@/components/summary/summary-sections-grid";
import { MeetingDetailTopbar } from "@/components/meetings/detail/meeting-detail-topbar";
import { useToast } from "@/components/ui/toast";
import { buildGoogleDocsContent } from "@/lib/summary/build-google-docs-content";
import { openInGoogleDocs } from "@/lib/summary/open-in-google-docs";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { useCallback, useState } from "react";

type MeetingSummaryViewProps = {
  meetingId: string;
  initialTitle: string;
  createdDate: string | null;
  durationLabel: string | null;
  participants: SummaryParticipant[];
  initialTopics: string[];
  initialNotes: SummaryNoteItem[];
};

export function MeetingSummaryView({
  meetingId,
  initialTitle,
  createdDate,
  durationLabel,
  participants,
  initialTopics,
  initialNotes,
}: MeetingSummaryViewProps) {
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [topics, setTopics] = useState(initialTopics);
  const [notes, setNotes] = useState(initialNotes);

  const handleOpenGoogleDocs = useCallback(async () => {
    const content = buildGoogleDocsContent({
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
        description: "Your summary was copied to the clipboard. Paste it into the new document.",
        type: "success",
      });
    } catch {
      window.open("https://docs.google.com/document/create", "_blank", "noopener,noreferrer");
      toast.add({
        title: "Could not copy automatically",
        description: "A new Google Doc was opened. Copy your summary manually if needed.",
        type: "info",
      });
    }
  }, [createdDate, durationLabel, notes, participants, title, toast, topics]);

  const handleToggleEditTitle = useCallback(() => {
    setIsEditingTitle((current) => {
      if (current) {
        setTitle((value) => value.trim() || initialTitle);
      }
      return !current;
    });
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
        onToggleEditTitle={handleToggleEditTitle}
        onOpenGoogleDocs={() => void handleOpenGoogleDocs()}
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
