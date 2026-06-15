import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { syncGoogleTokensFromClerk } from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

type SyncGoogleBody = {
  connectedFromPath?: unknown;
};

function normalizeAppPath(path: unknown) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}

export const postSyncGoogleFromClerk = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const body = (await c.req.json().catch(() => null)) as SyncGoogleBody | null;
  const connectedFromPath = normalizeAppPath(body?.connectedFromPath);

  const accessToken = await syncGoogleTokensFromClerk(
    useDB(c),
    userId,
    c.env,
    connectedFromPath,
  );

  return c.json({
    connected: Boolean(accessToken),
  });
};
