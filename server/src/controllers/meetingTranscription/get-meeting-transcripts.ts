import { Context } from "hono";
import { desc } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { meetingTranscriptions } from "../../schema/meetingTranscription/meeting-transcription.schema";
import type { Bindings } from "../../lib/common/types";
import {
  PUBLIC_ERRORS,
  sanitizeTranscriptForClient,
  toPublicApiError,
} from "../../lib/errors/public-error";

export const getMeetingTranscripts = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  try {
    const db = useDB(c);

    console.info("[meetingTranscription] Listing meeting transcripts");

    const transcripts = await db
      .select()
      .from(meetingTranscriptions)
      .orderBy(
        desc(meetingTranscriptions.completedAt),
        desc(meetingTranscriptions.createdAt),
      )
      .limit(20);

    return c.json(
      { transcripts: transcripts.map(sanitizeTranscriptForClient) },
      200,
    );
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};

export const getLatestMeetingTranscript = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  try {
    const db = useDB(c);

    const transcript = await db
      .select()
      .from(meetingTranscriptions)
      .orderBy(
        desc(meetingTranscriptions.completedAt),
        desc(meetingTranscriptions.createdAt),
      )
      .get();

    if (!transcript) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    return c.json(sanitizeTranscriptForClient(transcript), 200);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
