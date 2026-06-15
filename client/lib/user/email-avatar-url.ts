/**
 * Resolve a profile photo from an email address.
 *
 * Uses unavatar.io, which looks up Gravatar, Google profile photos, and other
 * public sources tied to the email. When nothing is found, image requests fail
 * and AvatarFallback (initials) is shown in the UI.
 *
 * To force a specific photo for a teammate, set `avatarUrl` on their entry in
 * `BRISK_STANDUP_TEAM` (`client/lib/meetings/brisk-standup-team.ts`).
 */
export function getEmailAvatarUrl(email: string, size = 150): string {
  const normalized = email.trim().toLowerCase();
  return `https://unavatar.io/${encodeURIComponent(normalized)}?size=${size}`;
}
