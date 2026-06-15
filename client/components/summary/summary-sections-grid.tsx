"use client";

import { SummaryNotesSection } from "@/components/summary/summary-notes-section";
import { SummaryParticipantsSection } from "@/components/summary/summary-participants-section";
import { SummaryTopicTrackerSection } from "@/components/summary/summary-topic-tracker-section";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";

type SummarySectionsGridProps = {
  participants: SummaryParticipant[];
  topics: string[];
  onTopicsChange: (topics: string[]) => void;
  notes: SummaryNoteItem[];
  onNotesChange: (notes: SummaryNoteItem[]) => void;
  isLoadingNotes?: boolean;
};

export function SummarySectionsGrid({
  participants,
  topics,
  onTopicsChange,
  notes,
  onNotesChange,
  isLoadingNotes = false,
}: SummarySectionsGridProps) {
  return (
    <div className="grid gap-6 pb-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <SummaryParticipantsSection participants={participants} />
        <SummaryTopicTrackerSection topics={topics} onTopicsChange={onTopicsChange} />
      </aside>

      <SummaryNotesSection
        notes={notes}
        onNotesChange={onNotesChange}
        topics={topics}
        isLoading={isLoadingNotes}
      />
    </div>
  );
}
