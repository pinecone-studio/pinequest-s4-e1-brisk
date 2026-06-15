import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import { deleteRecordingForUser } from "./recordings.service";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

export const deleteRecording = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: PUBLIC_ERRORS.auth }, 401);
  }

  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "id is required" }, 400);
  }

  try {
    const db = useDB(c);
    const deleted = await deleteRecordingForUser(c.env, db, id, userId);

    if (!deleted) {
      return c.json({ error: PUBLIC_ERRORS.notFound }, 404);
    }

    return c.json({ ok: true }, 200);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
