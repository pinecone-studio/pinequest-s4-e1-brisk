import { Context } from "hono";
import { eq } from "drizzle-orm";
import { useDB } from "../../lib/db/db";
import { meetings } from "../../schema/meeting.model";
import type { Bindings } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

// Marks a meeting `completed` and enqueues the post-meeting processing job
// (Google Doc generation + attendee emails). The queue handler does the slow
// work, so this responds as soon as the status is persisted.
export const postEndMeeting = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const meetingId = c.req.param("id");
    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const db = useDB(c);

    const meeting = await db
      .select({ id: meetings.id, status: meetings.status })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .get();

    if (!meeting) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    if (meeting.status !== "completed") {
      await db
        .update(meetings)
        .set({ status: "completed" })
        .where(eq(meetings.id, meetingId));
    }

    await c.env.MEETING_PROCESSING_QUEUE.send({ meetingId });

    return c.json({ status: "completed" }, 200);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
