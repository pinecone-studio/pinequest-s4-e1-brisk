import { eq } from "drizzle-orm";
import type { Context } from "hono";
import type { Bindings, Variables } from "../common/types";
import { useDB } from "../db/db";
import { users } from "../../schema/user.model";

export async function getAuthenticatedUserEmail(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  userId: string | null,
) {
  if (!userId) return null;

  const db = useDB(c);
  const user = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return user?.email ?? null;
}

export function buildParticipantMetadata(userId: string, email: string | null) {
  return JSON.stringify({
    userId,
    ...(email ? { email } : {}),
  });
}
