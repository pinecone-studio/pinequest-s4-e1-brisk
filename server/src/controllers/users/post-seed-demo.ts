import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import { ensureDemoStandupForUser } from "../../lib/seed/demo-standup.seed";
import { users } from "../../schema/schema";
import { eq } from "drizzle-orm";
import type { Bindings, Variables } from "../../lib/common/types";
import { PUBLIC_ERRORS, toPublicApiError } from "../../lib/errors/public-error";

export const seedDemoStandup = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const userId = await getAuthenticatedUserId(c);

    if (!userId) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const db = useDB(c);
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return c.json({ error: PUBLIC_ERRORS.auth }, 401);
    }

    const result = await ensureDemoStandupForUser(db, userId, user.email, user.name);

    return c.json(result, 200);
  } catch (error) {
    return c.json({ error: toPublicApiError(500) }, 500);
  }
};
