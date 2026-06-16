"use client";

import { MeetingSummaryView } from "@/components/summary/meeting-summary-view";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import type { ClerkProfile } from "@/lib/meetings/clerk-profile";
import {
  buildMockStandupSearchSuggestions,
  getMockStandupMeetingDisplay,
  getPersonalizedStandupParticipants,
} from "@/lib/meetings/mock-standup-story";
import { buildStandupDocTabs } from "@/lib/summary/build-full-mock-standup-google-docs-content";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

type MockStandupMeetingDetailViewProps = {
  meetingId: string;
};

function buildClerkProfileFromUser(
  user: NonNullable<ReturnType<typeof useUser>["user"]>,
): ClerkProfile | null {
  const email = user.primaryEmailAddress?.emailAddress?.trim();
  const name = user.fullName?.trim() || user.firstName?.trim() || email;
  if (!email || !name) return null;

  return {
    clerkId: user.id,
    email,
    name,
    avatarUrl: null,
    internalUserId: null,
  };
}

export function MockStandupMeetingDetailView({ meetingId }: MockStandupMeetingDetailViewProps) {
  const { user, isLoaded } = useUser();
  const mock = getMockStandupMeetingDisplay(meetingId);

  const clerkProfile = useMemo(() => {
    if (!isLoaded || !user) return null;
    return buildClerkProfileFromUser(user);
  }, [isLoaded, user]);

  const participants = useMemo(
    () => getPersonalizedStandupParticipants(clerkProfile),
    [clerkProfile],
  );

  const standupDocTabs = useMemo(
    () => buildStandupDocTabs(participants),
    [participants],
  );

  const searchSuggestions = useMemo(() => buildMockStandupSearchSuggestions(), []);
  useRegisterSearchSuggestions(`meeting-detail-${meetingId}`, searchSuggestions);

  if (!mock) {
    return null;
  }

  const { listItem, topics, notes, googleDocUrl } = mock;
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
      standupDocTabs={standupDocTabs}
      googleDocUrl={googleDocUrl}
    />
  );
}

/** @deprecated Use MockStandupMeetingDetailView */
export const MockSummaryMeetingDetailView = MockStandupMeetingDetailView;
