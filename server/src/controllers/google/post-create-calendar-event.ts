import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import {
  createCalendarEvent,
  type CreateCalendarEventInput,
} from "../../lib/google/google-calendar.service";
import { ensureGoogleAccessToken } from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCreateEventBody(body: unknown): CreateCalendarEventInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const payload = body as Record<string, unknown>;
  const summary = typeof payload.summary === "string" ? payload.summary.trim() : "";
  const startDateTime =
    typeof payload.startDateTime === "string" ? payload.startDateTime.trim() : "";
  const endDateTime =
    typeof payload.endDateTime === "string" ? payload.endDateTime.trim() : "";
  const timeZone = typeof payload.timeZone === "string" ? payload.timeZone.trim() : "";

  if (!summary || !startDateTime || !endDateTime || !timeZone) {
    return null;
  }

  const attendeeEmails = Array.isArray(payload.attendeeEmails)
    ? payload.attendeeEmails
        .filter((value): value is string => typeof value === "string")
        .map((email) => email.trim())
        .filter(Boolean)
    : undefined;

  if (attendeeEmails?.some((email) => !EMAIL_PATTERN.test(email))) {
    return null;
  }

  if (new Date(endDateTime).getTime() <= new Date(startDateTime).getTime()) {
    return null;
  }

  return {
    summary,
    startDateTime,
    endDateTime,
    timeZone,
    attendeeEmails,
  };
}

export const postCreateCalendarEvent = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const db = useDB(c);
  const accessToken = await ensureGoogleAccessToken(db, userId, c.env);

  if (!accessToken) {
    return c.json({ error: "Google Workspace is not connected." }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON request body." }, 400);
  }

  const input = parseCreateEventBody(body);
  if (!input) {
    return c.json({ error: "Invalid event details." }, 400);
  }

  try {
    const event = await createCalendarEvent(accessToken, input);
    return c.json({ connected: true, event }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_GOOGLE_SCOPES") {
      return c.json(
        {
          error:
            "Google Calendar write access is missing. Disconnect and reconnect Google, then try again.",
          code: "INSUFFICIENT_GOOGLE_SCOPES",
        },
        403,
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to create calendar event.";
    return c.json({ error: message }, 502);
  }
};
