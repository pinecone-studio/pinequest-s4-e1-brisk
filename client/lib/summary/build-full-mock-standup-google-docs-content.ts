import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import {
  MOCK_STANDUP_DAYS,
  type MockStandupDay,
} from "@/lib/meetings/mock-standup-story";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { buildMockStandupGoogleDocsContent } from "@/lib/summary/build-mock-standup-google-docs-content";

export type StandupDocTab = {
  day: number;
  tabLabel: string;
  meetingId: string;
  content: string;
};

function buildDayDocContent(day: MockStandupDay, participants: SummaryParticipant[]) {
  return buildMockStandupGoogleDocsContent({
    day,
    participants,
    createdDate: formatMeetingDateLong(day.listItem.createdAt) || null,
    durationLabel: getMeetingDurationLabel(day.listItem),
  });
}

export function buildStandupDocTabs(participants: SummaryParticipant[]): StandupDocTab[] {
  return MOCK_STANDUP_DAYS.map((day) => ({
    day: day.day,
    meetingId: day.id,
    tabLabel: `Day ${day.day} · ${day.dateLabel}`,
    content: buildDayDocContent(day, participants),
  }));
}
