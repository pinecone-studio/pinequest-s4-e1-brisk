import { Context } from "hono";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import { sendActionItemEmail } from "../../lib/email/send-action-item-email";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

type SendActionEmailBody = {
  meetingId?: string;
  meetingTitle?: string;
  noteTitle?: string;
  assignee?: string;
  assigneeEmail?: string;
  dateTimeLabel?: string | null;
  source?: "action" | "protocol";
};

export const postSendActionEmail = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const body = (await c.req.json().catch(() => null)) as SendActionEmailBody | null;
    const meetingId = body?.meetingId?.trim();
    const meetingTitle = body?.meetingTitle?.trim();
    const noteTitle = body?.noteTitle?.trim();
    const assignee = body?.assignee?.trim();
    const assigneeEmail = body?.assigneeEmail?.trim().toLowerCase();
    const source = body?.source === "protocol" ? "protocol" : "action";

    if (!meetingId || !meetingTitle || !noteTitle || !assignee || !assigneeEmail) {
      return c.json({ error: "Missing required email fields" }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigneeEmail)) {
      return c.json({ error: "Invalid assignee email address" }, 400);
    }

    await sendActionItemEmail({
      env: c.env,
      meetingId,
      meetingTitle,
      noteTitle,
      assignee,
      assigneeEmail,
      dateTimeLabel: body?.dateTimeLabel?.trim() || null,
      source,
    });

    return c.json({ sent: true, recipient: assigneeEmail }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : toPublicApiError(500);
    if (message.includes("Email service is not configured")) {
      return c.json({ error: "Email service is not configured on the server yet." }, 503);
    }
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
