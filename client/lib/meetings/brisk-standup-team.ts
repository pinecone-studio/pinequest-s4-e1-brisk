import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";

export type BriskStandupTeamMember = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  /** Optional override when email lookup does not return the right photo. */
  avatarUrl?: string;
};

export const BRISK_STANDUP_TEAM: BriskStandupTeamMember[] = [
  {
    id: "brisk-danny",
    name: "Данни",
    email: "danny.otgontsetseg@gmail.com",
    initials: "Д",
    role: "Team Lead",
  },
  {
    id: "brisk-batbilgu",
    name: "Батбилэг",
    email: "batbilgu@pinequest.dev",
    initials: "Б",
    role: "Backend Engineer",
  },
  {
    id: "brisk-suh-ochir",
    name: "Сүх-Очир",
    email: "suh-ochir@pinequest.dev",
    initials: "СО",
    role: "Frontend Engineer",
  },
  {
    id: "brisk-tsolmongerel",
    name: "Цолмонгэрэл",
    email: "tsolmongerel@pinequest.dev",
    initials: "Ц",
    role: "Product Designer",
  },
  {
    id: "brisk-amarjargal",
    name: "Амаржаргал",
    email: "amarjargal@pinequest.dev",
    initials: "А",
    role: "AI Engineer",
  },
];

export const BRISK_STANDUP_TEAM_NAMES = BRISK_STANDUP_TEAM.map((member) => member.name);

function isLoggedInTeamMember(
  profile: NonNullable<ReturnType<typeof getClerkProfile>>,
  member: BriskStandupTeamMember,
) {
  const profileEmail = profile.email.trim().toLowerCase();
  const memberEmail = member.email.trim().toLowerCase();

  if (profileEmail === memberEmail) return true;
  if (member.id === "brisk-danny" && profileEmail.includes("danny")) return true;

  return profile.name.trim() === member.name;
}

export function toStandupParticipant(member: BriskStandupTeamMember): SummaryParticipant {
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    avatarUrl: member.avatarUrl ?? getEmailAvatarUrl(member.email),
  };
}

export function getBriskStandupParticipants(): SummaryParticipant[] {
  const profile = getClerkProfile();

  return BRISK_STANDUP_TEAM.map((member) => {
    if (profile && isLoggedInTeamMember(profile, member)) {
      return {
        id: profile.clerkId,
        name: member.name,
        initials: member.initials,
        avatarUrl:
          profile.avatarUrl ?? member.avatarUrl ?? getEmailAvatarUrl(member.email),
      };
    }

    return toStandupParticipant(member);
  });
}

export function findBriskTeamMemberByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  return BRISK_STANDUP_TEAM.find(
    (member) => member.name === trimmed || trimmed.includes(member.name),
  );
}
