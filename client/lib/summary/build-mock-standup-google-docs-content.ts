import { findBriskTeamMemberByName, BRISK_STANDUP_TEAM } from "@/lib/meetings/brisk-standup-team";
import type { MockStandupDay } from "@/lib/meetings/mock-standup-story";
import { formatSummaryNoteDateTime } from "@/lib/summary/format-summary-note-date";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";

type BuildMockStandupGoogleDocsContentInput = {
  day: MockStandupDay;
  participants: SummaryParticipant[];
  createdDate: string | null;
  durationLabel: string | null;
  title?: string;
  topics?: string[];
  notes?: SummaryNoteItem[];
};

function resolveAssigneeLabel(assignee: string) {
  return findBriskTeamMemberByName(assignee)?.name ?? assignee.trim();
}

function groupActionItemsByAssignee(notes: SummaryNoteItem[]) {
  const grouped = new Map<string, SummaryNoteItem[]>();

  for (const note of notes) {
    if (note.source !== "action") continue;

    const assignee = resolveAssigneeLabel(note.assignee);
    const existing = grouped.get(assignee) ?? [];
    existing.push(note);
    grouped.set(assignee, existing);
  }

  const ordered: Array<[string, SummaryNoteItem[]]> = [];

  for (const member of BRISK_STANDUP_TEAM) {
    const tasks = grouped.get(member.name);
    if (tasks?.length) {
      ordered.push([member.name, tasks]);
      grouped.delete(member.name);
    }
  }

  for (const [assignee, tasks] of grouped.entries()) {
    ordered.push([assignee, tasks]);
  }

  return ordered;
}

export function buildMockStandupGoogleDocsContent({
  day,
  participants,
  createdDate,
  durationLabel,
  title,
  topics,
  notes,
}: BuildMockStandupGoogleDocsContentInput): string {
  const docTitle = title?.trim() || day.title;
  const docTopics = topics ?? day.topics;
  const docNotes = notes ?? day.notes;
  const actionItems = docNotes.filter((note) => note.source === "action");
  const protocols = docNotes.filter((note) => note.source === "protocol");
  const tasksByAssignee = groupActionItemsByAssignee(docNotes);

  const lines: string[] = [docTitle, ""];

  lines.push(`Standup day: ${day.day} (${day.dateLabel})`);
  if (createdDate) lines.push(`Meeting date: ${createdDate}`);
  if (durationLabel) lines.push(`Duration: ${durationLabel}`);
  lines.push("");

  lines.push("STANDUP MEETING BRIEFING");
  lines.push(day.meetingContent.trim());
  lines.push("");

  if (day.listItem.summaryPreview?.trim()) {
    lines.push("SUMMARY PREVIEW");
    lines.push(day.listItem.summaryPreview.trim());
    lines.push("");
  }

  lines.push("BRISK ROLE");
  lines.push(day.briskRole.trim());
  lines.push("");

  lines.push("PARTICIPANTS");
  for (const participant of participants) {
    const member = BRISK_STANDUP_TEAM.find(
      (entry) => entry.name === participant.name || entry.email === participant.email,
    );
    const role = member?.role ? ` · ${member.role}` : "";
    const email = participant.email ? ` (${participant.email})` : "";
    lines.push(`- ${participant.name}${email}${role}`);
  }
  lines.push("");

  lines.push("TOPICS DISCUSSED");
  for (const topic of docTopics) {
    lines.push(`- ${topic}`);
  }
  lines.push("");

  lines.push("TASK DIVISION");
  if (tasksByAssignee.length === 0) {
    lines.push("No action items recorded.");
  } else {
    for (const [assignee, tasks] of tasksByAssignee) {
      lines.push(`${assignee}:`);
      for (const task of tasks) {
        lines.push(`  • ${task.title}`);
      }
      lines.push("");
    }
  }

  lines.push("ACTION ITEMS");
  if (actionItems.length === 0) {
    lines.push("None.");
  } else {
    for (const note of actionItems) {
      lines.push(`• ${note.title}`);
      lines.push(`  Assignee: ${resolveAssigneeLabel(note.assignee)}`);
      lines.push(`  Due: ${formatSummaryNoteDateTime(note.dateTime)}`);
      lines.push("");
    }
  }

  lines.push("PROTOCOLS & STANDUP RULES");
  if (protocols.length === 0) {
    lines.push("None.");
  } else {
    for (const note of protocols) {
      lines.push(`• ${note.title}`);
      lines.push(`  Owner: ${resolveAssigneeLabel(note.assignee)}`);
      lines.push("");
    }
  }

  lines.push("FULL MEETING NOTES");
  for (const note of docNotes) {
    lines.push(
      `[${note.source === "protocol" ? "Protocol" : "Action item"}] ${note.title}`,
    );
    lines.push(`  Assignee: ${resolveAssigneeLabel(note.assignee)}`);
    lines.push(`  Date: ${formatSummaryNoteDateTime(note.dateTime)}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}
