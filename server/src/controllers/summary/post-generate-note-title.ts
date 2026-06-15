import { Context } from "hono";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import { generateNoteTitle } from "../../lib/gemini/generate-note-title";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

type GenerateNoteTitleBody = {
  meetingTitle?: string;
  assignee?: string;
  source?: "action" | "protocol";
  currentTitle?: string;
  topics?: string[];
};

export const postGenerateNoteTitle = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);
    if (!userId) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const body = (await c.req.json().catch(() => null)) as GenerateNoteTitleBody | null;
    const meetingTitle = body?.meetingTitle?.trim();
    const assignee = body?.assignee?.trim();

    if (!meetingTitle || !assignee) {
      return c.json({ error: "meetingTitle and assignee are required" }, 400);
    }

    const title = await generateNoteTitle(c.env, {
      meetingTitle,
      assignee,
      source: body?.source === "protocol" ? "protocol" : "action",
      currentTitle: body?.currentTitle,
      topics: body?.topics,
    });

    return c.json({ title }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : toPublicApiError(500);
    if (message.includes("Gemini API key")) {
      return c.json({ error: "AI title generation is not configured yet." }, 503);
    }
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
