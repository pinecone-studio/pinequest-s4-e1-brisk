import type {
  MeetingDetailsActionItem,
  MeetingListItem,
  MeetingTranscriptSegment,
} from "@/app/meeting";
import type { StandaloneRecording } from "@/app/recordings/types";
import type { AgendaEvent } from "@/lib/home/agenda-types";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";

export const buildMeetingSearchSuggestions = (
  meetings: MeetingListItem[],
): SearchSuggestion[] =>
  meetings.map((meeting) => ({
    id: `meeting-${meeting.id}`,
    title: meeting.title,
    subtitle: meeting.summaryPreview ?? undefined,
    href: `/meetings/${meeting.id}`,
    category: "Meeting",
    keywords: [
      meeting.summaryPreview ?? "",
      TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"].label,
    ],
  }));

export const buildRecordingSearchSuggestions = (
  recordings: StandaloneRecording[],
): SearchSuggestion[] =>
  recordings.map((recording) => ({
    id: `recording-${recording.id}`,
    title: recording.title,
    subtitle: recording.transcript?.slice(0, 80) ?? undefined,
    href: `/recordings/${recording.id}`,
    category: "Recording",
    keywords: [
      recording.transcript ?? "",
      ...(recording.keyPoints ?? []),
      TRANSCRIPTION_STATUS_STYLES[recording.status].label,
    ],
  }));

export const buildAgendaSearchSuggestions = (
  events: AgendaEvent[],
): SearchSuggestion[] =>
  events.map((event) => ({
    id: `agenda-${event.id}`,
    title: event.title,
    subtitle: event.startLabel,
    href: event.meetingUrl,
    category: "Calendar",
    keywords: [event.organizer, event.endLabel],
  }));

export const SETTINGS_SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: "settings-main",
    title: "Settings",
    subtitle: "Manage your Brisk account and meeting preferences.",
    href: "/settings",
    category: "Settings",
  },
  {
    id: "settings-preferences",
    title: "Account preferences",
    subtitle: "Account preferences are coming soon.",
    href: "/settings",
    category: "Settings",
  },
];

export const buildMeetingDetailSearchSuggestions = ({
  meetingId,
  title,
  summaryText,
  keyPoints,
  actionItems,
  topics,
  segments,
}: {
  meetingId: string;
  title: string;
  summaryText: string | null;
  keyPoints: string[];
  actionItems: MeetingDetailsActionItem[];
  topics: string[];
  segments: MeetingTranscriptSegment[];
}): SearchSuggestion[] => {
  const suggestions: SearchSuggestion[] = [
    {
      id: `meeting-detail-${meetingId}`,
      title,
      subtitle: summaryText ?? "Meeting details",
      href: `/meetings/${meetingId}`,
      category: "Meeting",
    },
  ];

  for (const point of keyPoints) {
    suggestions.push({
      id: `meeting-keypoint-${meetingId}-${point.slice(0, 24)}`,
      title: point,
      subtitle: title,
      href: `/meetings/${meetingId}`,
      category: "Key decision",
    });
  }

  for (const item of actionItems) {
    suggestions.push({
      id: `meeting-action-${meetingId}-${item.action.slice(0, 24)}`,
      title: item.action,
      subtitle: item.owner,
      href: `/meetings/${meetingId}`,
      category: "Action item",
      keywords: [item.owner],
    });
  }

  for (const topic of topics) {
    suggestions.push({
      id: `meeting-topic-${meetingId}-${topic.slice(0, 24)}`,
      title: topic,
      subtitle: title,
      href: `/meetings/${meetingId}`,
      category: "Topic",
    });
  }

  for (const segment of segments.slice(0, 20)) {
    suggestions.push({
      id: `meeting-segment-${segment.id}`,
      title: segment.text.slice(0, 80),
      subtitle: segment.speakerName,
      href: `/meetings/${meetingId}`,
      category: "Transcript",
      keywords: [segment.speakerName],
    });
  }

  return suggestions;
};

export const buildRecordingDetailSearchSuggestions = (
  recording: StandaloneRecording,
): SearchSuggestion[] => {
  const suggestions: SearchSuggestion[] = [
    {
      id: `recording-detail-${recording.id}`,
      title: recording.title,
      subtitle: recording.transcript?.slice(0, 80) ?? "Recording details",
      href: `/recordings/${recording.id}`,
      category: "Recording",
    },
  ];

  for (const point of recording.keyPoints ?? []) {
    suggestions.push({
      id: `recording-keypoint-${recording.id}-${point.slice(0, 24)}`,
      title: point,
      subtitle: recording.title,
      href: `/recordings/${recording.id}`,
      category: "Key point",
    });
  }

  for (const segment of recording.scriptSegments?.slice(0, 20) ?? []) {
    suggestions.push({
      id: `recording-segment-${recording.id}-${segment.speakerLabel}-${segment.text.slice(0, 16)}`,
      title: segment.text.slice(0, 80),
      subtitle: segment.speakerLabel,
      href: `/recordings/${recording.id}`,
      category: "Transcript",
      keywords: [segment.speakerLabel],
    });
  }

  return suggestions;
};
