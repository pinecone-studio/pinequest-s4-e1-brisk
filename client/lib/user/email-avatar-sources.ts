const AVATAR_SIZE = 150;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Primary avatar URL — generic unavatar lookup works better than /google/ for Gmail. */
export function getEmailAvatarUrl(email: string, size = AVATAR_SIZE): string {
  const normalized = normalizeEmail(email);
  return `https://unavatar.io/${encodeURIComponent(normalized)}?size=${size}`;
}

/** Fallback chain when the primary URL fails to load in the browser. */
export function getEmailAvatarSources(
  email: string,
  size = AVATAR_SIZE,
  preferredUrl?: string | null,
): string[] {
  const normalized = normalizeEmail(email);
  const encoded = encodeURIComponent(normalized);
  const sources = [
    preferredUrl,
    getEmailAvatarUrl(email, size),
    `https://unavatar.io/google/${encoded}?size=${size}`,
  ].filter((value): value is string => Boolean(value?.trim()));

  return [...new Set(sources)];
}
