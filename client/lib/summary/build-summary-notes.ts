import type { GetMeetingAnalysisDetailsResponse } from "@/app/meeting";
import { parseMeetingSummary } from "@/app/meeting/utils/parse-meeting-summary";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";

export function buildSummaryNotesFromMeetings(
  detailsList: GetMeetingAnalysisDetailsResponse[],
): SummaryNoteItem[] {
  const notes: SummaryNoteItem[] = [];

  for (const details of detailsList) {
    const meetingTitle = details.meeting.title;
    const meetingId = details.meeting.id;
    const dateTime =
      details.summary?.updatedAt ??
      details.meeting.updatedAt ??
      details.meeting.createdAt;

    const parsed = parseMeetingSummary(details.transcription?.summary ?? null);
    const protocols = parsed?.keyDecisions ?? details.summary?.keyPoints ?? [];
    const actionItems = parsed?.actionItems ?? details.summary?.actionItems ?? [];

    for (const [index, point] of protocols.entries()) {
      notes.push({
        id: `${meetingId}-protocol-${index}`,
        title: point,
        assignee: "Team",
        dateTime,
        meetingId,
        meetingTitle,
        source: "protocol",
      });
    }

    for (const [index, item] of actionItems.entries()) {
      notes.push({
        id: `${meetingId}-action-${index}`,
        title: item.action,
        assignee: item.owner,
        dateTime,
        meetingId,
        meetingTitle,
        source: "action",
      });
    }
  }

  return notes.sort(
    (left, right) =>
      new Date(right.dateTime ?? 0).getTime() - new Date(left.dateTime ?? 0).getTime(),
  );
}
