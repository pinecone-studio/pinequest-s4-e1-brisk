import type { RemoteParticipant } from "livekit-client";
import type { MeetingSessionParticipant } from "@/app/meeting/components/meeting-session-provider";

export type MeetingParticipantContact = {
  name: string;
  email: string;
};

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseMetadataEmail = (metadata: string | undefined) => {
  if (!metadata) return null;

  try {
    const parsed = JSON.parse(metadata) as { email?: unknown };
    return typeof parsed.email === "string" && EMAIL_ADDRESS_PATTERN.test(parsed.email)
      ? parsed.email.trim().toLowerCase()
      : null;
  } catch {
    return null;
  }
};

const parseIdentityEmail = (identity: string) => {
  const stableId = identity.split("__")[1]?.trim();
  return stableId && EMAIL_ADDRESS_PATTERN.test(stableId) ? stableId.toLowerCase() : null;
};

export function buildParticipantContacts({
  participants,
  remoteParticipants,
  localEmail,
  localName,
}: {
  participants: MeetingSessionParticipant[];
  remoteParticipants: RemoteParticipant[];
  localEmail?: string | null;
  localName?: string | null;
}): MeetingParticipantContact[] {
  const metadataEmailByIdentity = new Map<string, string>();

  for (const participant of remoteParticipants) {
    const email = parseMetadataEmail(participant.metadata);
    if (email) {
      metadataEmailByIdentity.set(participant.identity, email);
    }
  }

  const contacts: MeetingParticipantContact[] = [];
  const seenEmails = new Set<string>();

  for (const participant of participants) {
    const email = participant.isLocal
      ? localEmail?.trim().toLowerCase() ?? null
      : metadataEmailByIdentity.get(participant.identity) ??
        parseIdentityEmail(participant.identity);

    if (!email || !EMAIL_ADDRESS_PATTERN.test(email) || seenEmails.has(email)) {
      continue;
    }

    seenEmails.add(email);
    contacts.push({
      name: participant.isLocal
        ? localName?.trim() || participant.displayName
        : participant.displayName,
      email,
    });
  }

  return contacts;
}
