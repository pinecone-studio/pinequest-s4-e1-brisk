import { eq } from "drizzle-orm";
import {
  attendees,
  meetings,
  meetingTranscriptSegments,
} from "../../schema/meeting.model";
import { createMeetingSummaryDocument } from "../../lib/google/google-docs.service";
import { ensureGoogleAccessToken } from "../../lib/google/google-token.service";
import { generateMeetingProcessingSummary } from "../../lib/meetingSummary/generate-meeting-processing-summary";
import { sendMeetingDocEmails } from "../../lib/email/send-meeting-processing-emails";
import type { Bindings } from "../../lib/common/types";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";

const getRuntimeLogContext = (env: Bindings) => ({
  database: env.D1_DATABASE_NAME ?? "unknown",
  environment: env.ENVIRONMENT ?? "unknown",
});

// Runs the full post-meeting pipeline for a single meeting: builds the
// structured summary, creates (or reuses) the Google Doc, persists its URL,
// and emails attendees a link to it. Throws on failures that are worth
// retrying (missing meeting, Google auth/API errors); attendee email
// failures are logged but do not fail the job.
export const processMeetingForCompletion = async ({
  db,
  env,
  meetingId,
}: {
  db: MeetingTranscriptionDb;
  env: Bindings;
  meetingId: string;
}) => {
  const logContext = { ...getRuntimeLogContext(env), meetingId };

  const meeting = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .get();

  if (!meeting) {
    throw new Error(`Meeting not found: ${meetingId}`);
  }

  const [transcriptSegments, attendeeRows] = await Promise.all([
    db
      .select()
      .from(meetingTranscriptSegments)
      .where(eq(meetingTranscriptSegments.meetingId, meetingId))
      .orderBy(meetingTranscriptSegments.timestamp)
      .all(),
    db.select().from(attendees).where(eq(attendees.meetingId, meetingId)).all(),
  ]);

  let googleDocUrl = meeting.googleDocUrl;

  if (googleDocUrl) {
    console.info("[meetingProcessing] Reusing existing Google Doc", {
      ...logContext,
      googleDocUrl,
    });
  } else {
    const summary = await generateMeetingProcessingSummary(env, transcriptSegments);

    const accessToken = await ensureGoogleAccessToken(db, meeting.userId, env);

    if (!accessToken) {
      throw new Error(
        `No Google access token available for meeting owner ${meeting.userId}`,
      );
    }

    const doc = await createMeetingSummaryDocument(accessToken, {
      title: meeting.title,
      summary,
      segments: transcriptSegments,
    });

    googleDocUrl = doc.url;

    await db
      .update(meetings)
      .set({ googleDocUrl })
      .where(eq(meetings.id, meetingId));

    console.info("[meetingProcessing] Created Google Doc", {
      ...logContext,
      googleDocUrl,
      transcriptSegmentCount: transcriptSegments.length,
    });
  }

  if (!attendeeRows.length) {
    console.info("[meetingProcessing] No attendees to email", logContext);
    return { googleDocUrl, emailsSent: 0, emailsFailed: 0 };
  }

  const emailResult = await sendMeetingDocEmails({
    env,
    attendees: attendeeRows,
    meetingId,
    googleDocUrl,
  });

  if (emailResult.failed.length) {
    console.error("[meetingProcessing] Some attendee emails failed", {
      ...logContext,
      failed: emailResult.failed,
    });
  }

  return {
    googleDocUrl,
    emailsSent: emailResult.sent.length,
    emailsFailed: emailResult.failed.length,
  };
};
