import type { MeetingListItem } from "@/app/meeting";
import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import {
  getPersonalizedStandupParticipants,
  isMockStandupMeeting,
} from "@/lib/meetings/mock-standup-story";
import { getClerkInitials } from "@/lib/meetings/get-clerk-display-name";
import { users } from "@/lib/mock-data";
import type { AppUser } from "@/types";

export function getMeetingParticipants(meeting: MeetingListItem): AppUser[] {
  if (isMockStandupMeeting(meeting.id)) {
    return getPersonalizedStandupParticipants().map((participant) => ({
      id: participant.id,
      name: participant.name,
      email: getClerkProfile()?.email ?? `${participant.id}@pinequest.dev`,
      avatarUrl: participant.avatarUrl ?? null,
      initials: participant.initials,
      role: "Team member",
      team: "Brisk",
    }));
  }

  const profile = getClerkProfile();
  if (profile) {
    return [
      {
        id: profile.clerkId,
        name: profile.name || profile.email,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        initials: getClerkInitials(profile.name || profile.email),
        role: "Host",
        team: "Brisk",
      },
    ];
  }

  return users.slice(0, 1 + (meeting.id.charCodeAt(0) % 3));
}
