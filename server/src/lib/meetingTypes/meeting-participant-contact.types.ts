export type MeetingParticipantContact = {
  name: string;
  email: string;
};

export const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeParticipantContacts(
  contacts: MeetingParticipantContact[] | null | undefined,
): MeetingParticipantContact[] {
  if (!contacts?.length) return [];

  const seen = new Set<string>();
  const normalized: MeetingParticipantContact[] = [];

  for (const contact of contacts) {
    const email = contact.email.trim().toLowerCase();
    const name = contact.name.trim();

    if (!EMAIL_ADDRESS_PATTERN.test(email) || !name || seen.has(email)) {
      continue;
    }

    seen.add(email);
    normalized.push({ name, email });
  }

  return normalized;
}

export function parseParticipantContactsFromIdentity(identity: string) {
  const stableId = identity.split("__")[1]?.trim();
  if (!stableId || !EMAIL_ADDRESS_PATTERN.test(stableId)) {
    return null;
  }

  const name = identity.split("__")[0]?.trim() || stableId;
  return { name, email: stableId.toLowerCase() };
}
