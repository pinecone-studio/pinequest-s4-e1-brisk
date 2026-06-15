import { eq } from "drizzle-orm";
import type { Bindings } from "../common/types";
import { buildMeetingSummaryEmailContent } from "./build-meeting-summary-email-content";
import { parseMeetingSummary } from "../gemini/parse-meeting-summary";
import {
  normalizeParticipantContacts,
  type MeetingParticipantContact,
} from "../meetingTypes/meeting-participant-contact.types";
import { meetings, meetingSummaries } from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import { users } from "../../schema/user.model";
import type { MeetingTranscriptionDb } from "../meetingTypes/meeting-transcription.types";

const getSummaryUrl = (env: Bindings, meetingId: string) => {
  const baseUrl = (env.CLIENT_APP_URL ?? env.FRONTEND_URL ?? "").replace(/\/$/, "");
  return `${baseUrl}/meetings/${meetingId}`;
};

export async function sendMeetingSummaryEmails({
  db,
  env,
  meetingId,
  transcriptionId,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  meetingId: string;
  transcriptionId: string;
}) {
  if (!env.EMAIL || !env.EMAIL_FROM_ADDRESS) {
    console.warn("[email] Skipping meeting summary emails: EMAIL binding or EMAIL_FROM_ADDRESS missing");
    return;
  }

  const transcription = await db
    .select()
    .from(meetingTranscriptions)
    .where(eq(meetingTranscriptions.id, transcriptionId))
    .get();

  if (!transcription || transcription.summaryEmailsSentAt) {
    return;
  }

  const meeting = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      ownerEmail: users.email,
      ownerName: users.name,
    })
    .from(meetings)
    .innerJoin(users, eq(meetings.userId, users.id))
    .where(eq(meetings.id, meetingId))
    .get();

  if (!meeting) {
    console.warn("[email] Skipping meeting summary emails: meeting not found", { meetingId });
    return;
  }

  const summary = await db
    .select()
    .from(meetingSummaries)
    .where(eq(meetingSummaries.meetingId, meetingId))
    .get();

  const structuredSummary = parseMeetingSummary(transcription.summary);
  const participantContacts = normalizeParticipantContacts(transcription.participantEmails);

  const recipients: MeetingParticipantContact[] = [...participantContacts];
  const seenEmails = new Set(recipients.map((recipient) => recipient.email));

  if (meeting.ownerEmail && !seenEmails.has(meeting.ownerEmail.toLowerCase())) {
    recipients.push({
      name: meeting.ownerName,
      email: meeting.ownerEmail.toLowerCase(),
    });
  }

  if (!recipients.length) {
    await db
      .update(meetingTranscriptions)
      .set({
        summaryEmailsError: "No participant email addresses were available",
      })
      .where(eq(meetingTranscriptions.id, transcriptionId));
    return;
  }

  const { subject, text, html } = buildMeetingSummaryEmailContent({
    meetingTitle: meeting.title,
    summaryUrl: getSummaryUrl(env, meetingId),
    structuredSummary,
    summaryPreview: summary?.content ?? null,
  });

  const fromName = env.EMAIL_FROM_NAME ?? "Brisk";
  const failures: string[] = [];

  for (const recipient of recipients) {
    try {
      await env.EMAIL.send({
        from: { email: env.EMAIL_FROM_ADDRESS, name: fromName },
        to: recipient.email,
        subject,
        text,
        html,
      });
    } catch (error) {
      failures.push(`${recipient.email}: ${(error as Error).message}`);
    }
  }

  if (failures.length === recipients.length) {
    await db
      .update(meetingTranscriptions)
      .set({ summaryEmailsError: failures.join("; ") })
      .where(eq(meetingTranscriptions.id, transcriptionId));
    return;
  }

  await db
    .update(meetingTranscriptions)
    .set({
      summaryEmailsSentAt: new Date(),
      summaryEmailsError: failures.length ? failures.join("; ") : null,
    })
    .where(eq(meetingTranscriptions.id, transcriptionId));
}
