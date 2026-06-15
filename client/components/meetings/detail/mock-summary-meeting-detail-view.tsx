"use client";

import { MeetingSummaryView } from "@/components/summary/meeting-summary-view";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import {
  buildMockSummaryMeetingSearchSuggestions,
  getMockSummaryMeetingDisplay,
} from "@/lib/meetings/mock-summary-meeting";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { useMemo } from "react";

export function MockSummaryMeetingDetailView() {
  const mock = getMockSummaryMeetingDisplay();
  const { listItem, participants, topics, notes } = mock;

  const searchSuggestions = useMemo(() => buildMockSummaryMeetingSearchSuggestions(), []);
  useRegisterSearchSuggestions(`meeting-detail-${listItem.id}`, searchSuggestions);

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
