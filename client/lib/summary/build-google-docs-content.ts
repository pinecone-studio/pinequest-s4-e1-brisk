import { formatSummaryNoteDateTime } from "@/lib/summary/format-summary-note-date";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";

type BuildGoogleDocsContentInput = {
  title: string;
  createdDate: string | null;
  durationLabel: string | null;
  participants: SummaryParticipant[];
  topics: string[];
  notes: SummaryNoteItem[];
  meetingBrief?: string | null;
  briskRole?: string | null;
};

export function buildGoogleDocsContent({
  title,
  createdDate,
  durationLabel,
  participants,
  topics,
  notes,
  meetingBrief,
  briskRole,
}: BuildGoogleDocsContentInput): string {
  const lines: string[] = [title, ""];

  if (createdDate) lines.push(`Date: ${createdDate}`);
  if (durationLabel) lines.push(`Duration: ${durationLabel}`);
  if (createdDate || durationLabel) lines.push("");

  if (meetingBrief?.trim()) {
    lines.push("Meeting brief");
    lines.push(meetingBrief.trim());
    lines.push("");
  }

  if (briskRole?.trim()) {
    lines.push("Brisk role");
    lines.push(briskRole.trim());
    lines.push("");
  }

  lines.push("Participants");
  for (const participant of participants) {
    lines.push(`- ${participant.name}`);
  }
  lines.push("");

  lines.push("Topics");
  for (const topic of topics) {
    lines.push(`- ${topic}`);
  }
  lines.push("");

  lines.push("Notes");
  for (const note of notes) {
    lines.push(
      `[${note.source === "protocol" ? "Protocol" : "Action item"}] ${note.title}`,
    );
    lines.push(`  Assignee: ${note.assignee}`);
    lines.push(`  Date: ${formatSummaryNoteDateTime(note.dateTime)}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
