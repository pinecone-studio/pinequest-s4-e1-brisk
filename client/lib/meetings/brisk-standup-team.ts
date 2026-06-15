import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";

export type BriskStandupTeamMember = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  /** Legacy mock-story names that map to this teammate. */
  aliases?: string[];
  /** Optional fixed profile photo when email lookup has no public image. */
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
    id: "brisk-chinbat",
    name: "Чинбат",
    aliases: ["Батбилэг"],
    email: "batblg247@gmail.com",
    initials: "Ч",
    role: "Backend Engineer",
  },
  {
    id: "brisk-suh-ochir",
    name: "Сүх-Очир",
    email: "batjargalsukhochir27@gmail.com",
    initials: "СО",
    role: "Frontend Engineer",
  },
  {
    id: "brisk-tsolmongerel",
    name: "Цолмонгэрэл",
    email: "tsomoobayasaa@gmail.com",
    initials: "Ц",
    role: "Product Designer",
  },
  {
    id: "brisk-amarjargal",
    name: "Амаржаргал",
    email: "maraa96098@gmail.com",
    initials: "А",
    role: "AI Engineer",
  },
];

export const BRISK_STANDUP_TEAM_NAMES = BRISK_STANDUP_TEAM.map((member) => member.name);

const BRISK_TEAM_NAME_ALIASES: Record<string, string> = {
  Батбилэг: "Чинбат",
};

function memberMatchesName(member: BriskStandupTeamMember, name: string) {
  if (member.name === name || name.includes(member.name)) {
    return true;
  }

  return member.aliases?.some(
    (alias) => alias === name || name.includes(alias) || alias.includes(name),
  );
}

function isLoggedInTeamMember(
  profile: NonNullable<ReturnType<typeof getClerkProfile>>,
  member: BriskStandupTeamMember,
) {
  const profileEmail = profile.email.trim().toLowerCase();
  const memberEmail = member.email.trim().toLowerCase();

  if (profileEmail === memberEmail) return true;
  if (member.id === "brisk-danny" && profileEmail.includes("danny")) return true;

  if (memberMatchesName(member, profile.name.trim())) return true;

  return profile.name.trim() === member.name;
}

export function getBriskStandupTeamEmails(): string[] {
  return BRISK_STANDUP_TEAM.map((member) => member.email.trim().toLowerCase());
}

export function toStandupParticipant(member: BriskStandupTeamMember): SummaryParticipant {
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    email: member.email,
    avatarUrl: member.avatarUrl ?? getEmailAvatarUrl(member.email),
  };
}

export function getBriskStandupParticipants(
  profileOverride?: ReturnType<typeof getClerkProfile>,
): SummaryParticipant[] {
  const profile = profileOverride ?? getClerkProfile();

  return BRISK_STANDUP_TEAM.map((member) => {
    if (profile && isLoggedInTeamMember(profile, member)) {
      return {
        id: profile.clerkId,
        name: member.name,
        initials: member.initials,
        email: member.email,
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

  const canonical = BRISK_TEAM_NAME_ALIASES[trimmed] ?? trimmed;

  return BRISK_STANDUP_TEAM.find(
    (member) => memberMatchesName(member, trimmed) || memberMatchesName(member, canonical),
  );
}
