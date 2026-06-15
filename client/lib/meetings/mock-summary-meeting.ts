import type { MeetingListItem } from "@/app/meeting";
import {
  MOCK_SUMMARY_NOTES,
  MOCK_SUMMARY_PARTICIPANTS,
  MOCK_SUMMARY_TOPICS,
} from "@/lib/summary/mock-summary-data";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";

export const MOCK_SUMMARY_MEETING_ID = "mock-summary-meeting";

export const MOCK_SUMMARY_MEETING_LIST_ITEM: MeetingListItem = {
  id: MOCK_SUMMARY_MEETING_ID,
  title: "Product sync — Brisk v2",
  createdAt: "2026-06-14T10:00:00.000Z",
  updatedAt: "2026-06-14T10:30:00.000Z",
  transcriptionStatus: "done",
  summaryPreview:
    "The team aligned on Q2 roadmap priorities, the recording pipeline, bilingual translation, and showing meeting summaries on finished meeting cards.",
};

export type MockSummaryMeetingDisplay = {
  participants: SummaryParticipant[];
  topics: string[];
  notes: SummaryNoteItem[];
  listItem: MeetingListItem;
};

export function isMockSummaryMeeting(meetingId: string) {
  return meetingId === MOCK_SUMMARY_MEETING_ID;
}

export function prependMockSummaryMeeting(meetings: MeetingListItem[]): MeetingListItem[] {
  if (meetings.some((meeting) => meeting.id === MOCK_SUMMARY_MEETING_ID)) {
    return meetings;
  }

  return [MOCK_SUMMARY_MEETING_LIST_ITEM, ...meetings];
}

export function getMockSummaryMeetingDisplay(): MockSummaryMeetingDisplay {
  return {
    listItem: MOCK_SUMMARY_MEETING_LIST_ITEM,
    participants: MOCK_SUMMARY_PARTICIPANTS,
    topics: MOCK_SUMMARY_TOPICS.map((topic) => topic.label),
    notes: MOCK_SUMMARY_NOTES,
  };
}

export function buildMockSummaryMeetingSearchSuggestions(): SearchSuggestion[] {
  const { listItem, topics, notes } = getMockSummaryMeetingDisplay();
  const href = `/meetings/${listItem.id}`;

  return [
    {
      id: "mock-summary-meeting",
      title: listItem.title,
      subtitle: listItem.summaryPreview ?? undefined,
      href,
      category: "Meeting",
    },
    ...topics.map((topic) => ({
      id: `mock-summary-topic-${topic}`,
      title: topic,
      subtitle: listItem.title,
      href,
      category: "Topic",
      keywords: ["topic", "tracker"],
    })),
    ...notes.map((note) => ({
      id: `mock-summary-note-${note.id}`,
      title: note.title,
      subtitle: `${note.assignee} · ${note.meetingTitle}`,
      href,
      category: note.source === "protocol" ? "Protocol" : "Action item",
      keywords: [note.assignee, note.source],
    })),
  ];
}
