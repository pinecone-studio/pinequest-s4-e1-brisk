import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { getGoogleConnectionMeta } from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

export const getGoogleStatus = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const meta = await getGoogleConnectionMeta(useDB(c), userId, c.env);
  return c.json(meta);
};
