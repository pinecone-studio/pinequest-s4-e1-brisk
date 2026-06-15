import { Context } from "hono";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { useDB } from "../../lib/db/db";
import { meetings, meetingTranscriptSegments } from "../../schema/meeting.model";
import type { Bindings } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

type StreamTranscriptBody = {
  speaker?: unknown;
  text?: unknown;
};

// Persists a single transcript chunk the moment it arrives, so an in-progress
// meeting's transcript survives a page refresh or tab close. Each call is a
// single insert — no batching, since chunks stream in one at a time.
export const postStreamTranscript = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  try {
    const meetingId = c.req.param("id");
    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const body = (await c.req.json().catch(() => null)) as StreamTranscriptBody | null;
    const speaker = typeof body?.speaker === "string" ? body.speaker.trim() : "";
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!speaker) return c.json({ error: "speaker is required" }, 400);
    if (!text) return c.json({ error: "text is required" }, 400);

    const db = useDB(c);

    const meeting = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .get();

    if (!meeting) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    const id = nanoid();
    const timestamp = new Date();

    await db.insert(meetingTranscriptSegments).values({
      id,
      meetingId,
      speakerName: speaker,
      text,
      timestamp,
    });

    return c.json({ id, timestamp }, 201);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
