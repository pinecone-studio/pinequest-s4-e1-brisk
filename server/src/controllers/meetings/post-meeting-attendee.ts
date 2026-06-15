import { Context } from "hono";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { useDB } from "../../lib/db/db";
import { attendees, meetings } from "../../schema/meeting.model";
import { EMAIL_ADDRESS_PATTERN } from "../../lib/meetingTypes/meeting-participant-contact.types";
import type { Bindings } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

type AttendeeBody = {
  email?: unknown;
  name?: unknown;
};

// Registers (or updates the display name for) an attendee of a meeting.
// Upserts on (meeting_id, email) so repeated calls — e.g. a participant
// reconnecting — don't create duplicate rows.
export const postMeetingAttendee = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  try {
    const meetingId = c.req.param("id");
    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const body = (await c.req.json().catch(() => null)) as AttendeeBody | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !EMAIL_ADDRESS_PATTERN.test(email)) {
      return c.json({ error: "A valid email is required" }, 400);
    }
    if (!name) return c.json({ error: "name is required" }, 400);

    const db = useDB(c);

    const meeting = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .get();

    if (!meeting) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    await db
      .insert(attendees)
      .values({ id: nanoid(), meetingId, email, name })
      .onConflictDoUpdate({
        target: [attendees.meetingId, attendees.email],
        set: { name },
      });

    return c.json({ status: "ok" }, 201);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
