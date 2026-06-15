import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";
import { ensureMeetingForUser } from "./ensure-meeting";

type StartMeetingBody = {
  title?: unknown;
};

export const postStartMeeting = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);

    if (!userId) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const meetingId = c.req.param("id");
    if (!meetingId) return c.json({ error: "id is required" }, 400);

    const body = (await c.req.json().catch(() => null)) as StartMeetingBody | null;
    const title = typeof body?.title === "string" ? body.title : undefined;

    const db = useDB(c);
    const ensured = await ensureMeetingForUser(db, { meetingId, userId, title });

    if (!ensured.ok) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    return c.json(
      {
        id: ensured.meeting.id,
        status: ensured.meeting.status,
        created: ensured.created,
      },
      ensured.created ? 201 : 200,
    );
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
