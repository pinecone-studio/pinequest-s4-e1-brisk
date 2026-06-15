import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import {
  saveGoogleTokens,
  saveInitialGoogleConnectedFromPath,
} from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type GoogleOAuthBody = {
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
  connectedFromPath?: unknown;
};

function normalizeAppPath(path: unknown) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}

export const postGoogleOAuthComplete = async (c: Context<HonoEnv>) => {
  const body = (await c.req.json().catch(() => null)) as GoogleOAuthBody | null;

  if (!body?.accessToken || typeof body.accessToken !== "string") {
    return c.json({ error: "accessToken is required." }, 400);
  }

  const refreshToken =
    typeof body.refreshToken === "string" ? body.refreshToken : null;
  const expiresIn =
    typeof body.expiresIn === "number" && body.expiresIn > 0
      ? body.expiresIn
      : 3600;
  const connectedFromPath = normalizeAppPath(body.connectedFromPath);

  const userId = c.get("userId");
  const db = useDB(c);

  await saveGoogleTokens(db, userId, c.env, {
    accessToken: body.accessToken,
    refreshToken,
    expiresIn,
  });

  if (connectedFromPath) {
    await saveInitialGoogleConnectedFromPath(db, userId, connectedFromPath);
  }

  return c.json({ ok: true });
};
