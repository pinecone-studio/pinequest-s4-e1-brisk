import { Context } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  attendees,
  meetings,
  meetingSummaries,
  meetingTranscriptSegments,
} from "../../schema/meeting.model";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import type { Bindings, Variables } from "../../lib/common/types";
import {
  PUBLIC_ERRORS,
  sanitizeTranscriptForClient,
  toPublicApiError,
} from "../../lib/errors/public-error";

export const getMeetingDetails = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);

    if (!userId) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const meetingId = c.req.param("id");

    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const db = useDB(c);

    const meeting = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.userId, userId)))
      .get();

    if (!meeting) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    const [transcription, summary, transcriptSegments, meetingAttendees] = await Promise.all([
      db
        .select()
        .from(meetingTranscriptions)
        .where(eq(meetingTranscriptions.meetingId, meetingId))
        .orderBy(desc(meetingTranscriptions.createdAt))
        .get(),
      db
        .select()
        .from(meetingSummaries)
        .where(eq(meetingSummaries.meetingId, meetingId))
        .get(),
      db
        .select()
        .from(meetingTranscriptSegments)
        .where(eq(meetingTranscriptSegments.meetingId, meetingId))
        .orderBy(meetingTranscriptSegments.timestamp)
        .all(),
      db
        .select()
        .from(attendees)
        .where(eq(attendees.meetingId, meetingId))
        .all(),
    ]);

    return c.json(
      {
        meeting,
        transcription: transcription ? sanitizeTranscriptForClient(transcription) : null,
        summary: summary ?? null,
        transcriptSegments,
        attendees: meetingAttendees,
      },
      200,
    );
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
