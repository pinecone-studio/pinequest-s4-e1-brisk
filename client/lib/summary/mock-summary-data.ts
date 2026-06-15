import { users } from "@/lib/mock-data";
import type { SummaryParticipant, SummaryTopic } from "@/lib/summary/summary-participant.types";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";

const mockMeetingId = "mock-summary-meeting";
const mockMeetingTitle = "Product sync — Brisk v2";

export const MOCK_SUMMARY_PARTICIPANTS: SummaryParticipant[] = users.slice(0, 4).map(
  (user) => ({
    id: user.id,
    name: user.name,
    initials: user.initials,
    avatarUrl: user.avatarUrl ?? getEmailAvatarUrl(user.email),
  }),
);

export const MOCK_SUMMARY_TOPICS: SummaryTopic[] = [
  { id: "st-1", label: "Q2 roadmap" },
  { id: "st-2", label: "Recording pipeline" },
  { id: "st-3", label: "MN/EN translation" },
  { id: "st-4", label: "Google Calendar sync" },
  { id: "st-5", label: "Summary approvals" },
];

export const MOCK_SUMMARY_NOTES: SummaryNoteItem[] = [
  {
    id: "sn-1",
    title: "Finalize the finished-meeting summary layout before the next sprint review.",
    assignee: "Saraa Batbold",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "action",
  },
  {
    id: "sn-2",
    title: "Ship Google Calendar reconnect flow with clearer error messaging.",
    assignee: "Anna Kim",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "action",
  },
  {
    id: "sn-3",
    title: "Prepare stakeholder demo using the mock finished meeting card.",
    assignee: "Wilson Reed",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "action",
  },
  {
    id: "sn-4",
    title: "Team agreed to keep topic tracker compact under participants.",
    assignee: "Team",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "protocol",
  },
  {
    id: "sn-5",
    title: "Notes cards will use meeting action items and key decisions as source data.",
    assignee: "Team",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "protocol",
  },
  {
    id: "sn-6",
    title: "Add bilingual transcript support to the recording pipeline next sprint.",
    assignee: "Temuulen Ganbat",
    dateTime: "2026-06-14T10:30:00.000Z",
    meetingId: mockMeetingId,
    meetingTitle: mockMeetingTitle,
    source: "action",
  },
];
