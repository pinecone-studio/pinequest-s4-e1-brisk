"use client";

import { MeetingSummaryView } from "@/components/summary/meeting-summary-view";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import {
  buildMockStandupSearchSuggestions,
  getMockStandupMeetingDisplay,
} from "@/lib/meetings/mock-standup-story";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { useMemo } from "react";

type MockStandupMeetingDetailViewProps = {
  meetingId: string;
};

export function MockStandupMeetingDetailView({ meetingId }: MockStandupMeetingDetailViewProps) {
  const mock = getMockStandupMeetingDisplay(meetingId);

  const searchSuggestions = useMemo(() => buildMockStandupSearchSuggestions(), []);
  useRegisterSearchSuggestions(`meeting-detail-${meetingId}`, searchSuggestions);

  if (!mock) {
    return null;
  }

  const { listItem, participants, topics, notes } = mock;
  const createdDate = formatMeetingDateLong(listItem.createdAt) || null;
  const durationLabel = getMeetingDurationLabel(listItem);

  return (
    <MeetingSummaryView
      meetingId={listItem.id}
      initialTitle={listItem.title}
      createdDate={createdDate}
      durationLabel={durationLabel}
      participants={participants}
      initialTopics={topics}
      initialNotes={notes}
    />
  );
}

/** @deprecated Use MockStandupMeetingDetailView */
export const MockSummaryMeetingDetailView = MockStandupMeetingDetailView;
