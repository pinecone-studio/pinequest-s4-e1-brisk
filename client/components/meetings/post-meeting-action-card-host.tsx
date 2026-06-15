"use client";

import type { MeetingDetailsActionItem } from "@/app/meeting";
import { BRISK_STANDUP_TEAM } from "@/lib/meetings/brisk-standup-team";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PostMeetingActionCard } from "./post-meeting-action-card";
import type { PostMeetingTeammateOption } from "./post-meeting-action-card.types";

const DISMISS_STORAGE_PREFIX = "brisk:post-meeting-dismissed:";

type PostMeetingActionCardHostProps = {
  meetingId: string;
  initialTitle?: string;
  actionItems: MeetingDetailsActionItem[];
  isReady: boolean;
  onSaved?: () => void;
};

function getDismissStorageKey(meetingId: string) {
  return `${DISMISS_STORAGE_PREFIX}${meetingId}`;
}

export function PostMeetingActionCardHost({
  meetingId,
  initialTitle,
  actionItems,
  isReady,
  onSaved,
}: PostMeetingActionCardHostProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(getDismissStorageKey(meetingId)) === "1";
  });

  useEffect(() => {
    setIsDismissed(
      typeof window !== "undefined" &&
        window.sessionStorage.getItem(getDismissStorageKey(meetingId)) === "1",
    );
  }, [meetingId]);

  const teammates = useMemo<PostMeetingTeammateOption[]>(
    () =>
      BRISK_STANDUP_TEAM.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
      })),
    [],
  );

  const handleDismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(getDismissStorageKey(meetingId), "1");
    }
    setIsDismissed(true);
  }, [meetingId]);

  const open = isReady && !isDismissed;

  return (
    <PostMeetingActionCard
      meetingId={meetingId}
      initialTitle={initialTitle}
      actionItems={actionItems}
      teammates={teammates}
      open={open}
      onDismiss={handleDismiss}
      onSaved={onSaved}
    />
  );
}
