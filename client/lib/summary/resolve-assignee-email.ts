import { getClerkProfile } from "@/lib/meetings/clerk-profile";
import { users } from "@/lib/mock-data";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveAssigneeEmail(assignee: string): string | null {
  const trimmed = assignee.trim();
  if (!trimmed) return null;

  if (EMAIL_PATTERN.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const profile = getClerkProfile();
  if (profile) {
    if (
      trimmed === profile.name ||
      trimmed === profile.email ||
      trimmed === "You" ||
      trimmed === "Баг"
    ) {
      return profile.email.toLowerCase();
    }
  }

  const matchedUser = users.find(
    (user) =>
      user.name === trimmed ||
      user.email.toLowerCase() === trimmed.toLowerCase() ||
      trimmed.includes(user.name),
  );

  return matchedUser?.email.toLowerCase() ?? null;
}

export function parseInviteEmails(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((email) => {
      if (!EMAIL_PATTERN.test(email) || seen.has(email)) {
        return false;
      }
      seen.add(email);
      return true;
    });
}
