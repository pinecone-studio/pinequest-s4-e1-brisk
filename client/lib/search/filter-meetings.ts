import type { MeetingListItem } from "@/app/meeting";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import { getMeetingFolder } from "@/lib/meetings/meeting-folders";
import { getMeetingParticipants } from "@/lib/meetings/meeting-participants";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";

export const filterMeetingsBySearch = (
  meetings: MeetingListItem[],
  query: string,
) => {
  if (!query.trim()) return meetings;

  return meetings.filter((meeting) => {
    const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];
    const folder = getMeetingFolder(meeting);
    const participants = getMeetingParticipants(meeting);

    return matchesSearchQuery(
      query,
      meeting.title,
      meeting.summaryPreview,
      status.label,
      folder.label,
      getMeetingDurationLabel(meeting),
      ...participants.map((participant) => participant.name),
    );
  });
};
