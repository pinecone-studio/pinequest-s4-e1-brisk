import { desc, eq, isNotNull } from "drizzle-orm";
import type { Bindings } from "../common/types";
import { useDB } from "../db/db";
import { users } from "../../schema/schema";

type Db = ReturnType<typeof useDB>;

export function isGoogleDemoShared(env: Bindings) {
  return env.GOOGLE_DEMO_SHARED === "true";
}

export async function resolveGoogleCalendarUserId(
  db: Db,
  userId: string,
  env: Bindings,
): Promise<string> {
  if (!isGoogleDemoShared(env)) {
    return userId;
  }

  const ownerEmail = env.GOOGLE_DEMO_CALENDAR_EMAIL?.trim();
  if (ownerEmail) {
    const [owner] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, ownerEmail))
      .limit(1);

    if (owner) {
      return owner.id;
    }
  }

  const [tokenHolder] = await db
    .select({ id: users.id })
    .from(users)
    .where(isNotNull(users.encryptedGoogleAccessToken))
    .orderBy(desc(users.updatedAt))
    .limit(1);

  return tokenHolder?.id ?? userId;
}
