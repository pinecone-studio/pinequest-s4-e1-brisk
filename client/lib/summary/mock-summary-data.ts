import {
  getMockStandupMeetingDisplay,
  MOCK_SUMMARY_MEETING_ID,
  MOCK_STANDUP_PARTICIPANTS,
} from "@/lib/meetings/mock-standup-story";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant, SummaryTopic } from "@/lib/summary/summary-participant.types";

const heroDisplay = getMockStandupMeetingDisplay(MOCK_SUMMARY_MEETING_ID);

export const MOCK_SUMMARY_PARTICIPANTS: SummaryParticipant[] = MOCK_STANDUP_PARTICIPANTS;

export const MOCK_SUMMARY_TOPICS: SummaryTopic[] =
  heroDisplay?.topics.map((label, index) => ({
    id: `st-${index + 1}`,
    label,
  })) ?? [];

export const MOCK_SUMMARY_NOTES: SummaryNoteItem[] = heroDisplay?.notes ?? [];
