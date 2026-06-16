const AVATAR_SIZE = 150;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Gmail profile photo via Brisk backend (uses your connected Google account). */
export function getGmailAvatarUrl(email: string, size = AVATAR_SIZE): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return "";
  }

  const params = new URLSearchParams({
    email: normalized,
    size: String(size),
  });

  return `/api/gmail-avatar?${params.toString()}`;
}

/** @deprecated Use getGmailAvatarUrl */
export const getEmailAvatarUrl = getGmailAvatarUrl;

export function getEmailAvatarSources(email: string, size = AVATAR_SIZE): string[] {
  if (!email.trim()) {
    return [];
  }

  return [getGmailAvatarUrl(email, size)];
}
