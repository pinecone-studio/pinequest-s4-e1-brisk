import { eq } from "drizzle-orm";
import type { Bindings } from "../common/types";
import { useDB } from "../db/db";
import { decryptToken, encryptToken } from "../crypto/token-encryption";
import { fetchGoogleTokenFromClerk } from "./clerk-google-token.service";
import { isGoogleDemoShared, resolveGoogleCalendarUserId } from "./demo-google.service";

type Db = ReturnType<typeof useDB>;
import { users } from "../../schema/schema";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

async function resolveTokenUserId(db: Db, userId: string, env: Bindings) {
  return resolveGoogleCalendarUserId(db, userId, env);
}

export async function saveGoogleTokens(
  db: Db,
  userId: string,
  env: Bindings,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresIn: number;
  },
) {
  const tokenUserId = await resolveTokenUserId(db, userId, env);
  const encryptionKey = env.ENCRYPTION_KEY ?? "";
  const encryptedAccess = await encryptToken(tokens.accessToken, encryptionKey);
  const expiryMs = Date.now() + tokens.expiresIn * 1000;

  const update: {
    encryptedGoogleAccessToken: string;
    googleTokenExpiry: number;
    updatedAt: Date;
    encryptedGoogleRefreshToken?: string | null;
  } = {
    encryptedGoogleAccessToken: encryptedAccess,
    googleTokenExpiry: expiryMs,
    updatedAt: new Date(),
  };

  if (tokens.refreshToken) {
    update.encryptedGoogleRefreshToken = await encryptToken(
      tokens.refreshToken,
      encryptionKey,
    );
  }

  await db.update(users).set(update).where(eq(users.id, tokenUserId));
}

export async function getGoogleAccessToken(
  db: Db,
  userId: string,
  env: Bindings,
): Promise<string | null> {
  const tokenUserId = await resolveTokenUserId(db, userId, env);
  const [user] = await db
    .select({
      encryptedGoogleAccessToken: users.encryptedGoogleAccessToken,
      encryptedGoogleRefreshToken: users.encryptedGoogleRefreshToken,
      googleTokenExpiry: users.googleTokenExpiry,
    })
    .from(users)
    .where(eq(users.id, tokenUserId))
    .limit(1);

  if (!user?.encryptedGoogleAccessToken) {
    return null;
  }

  const encryptionKey = env.ENCRYPTION_KEY ?? "";
  const expiryMs = user.googleTokenExpiry ?? 0;

  if (expiryMs - Date.now() > 60_000) {
    return decryptToken(user.encryptedGoogleAccessToken, encryptionKey);
  }

  if (!user.encryptedGoogleRefreshToken) {
    return null;
  }

  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }

  const refreshToken = await decryptToken(
    user.encryptedGoogleRefreshToken,
    encryptionKey,
  );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!tokenRes.ok) {
    return null;
  }

  const refreshed = (await tokenRes.json()) as GoogleTokenResponse;

  await saveGoogleTokens(db, tokenUserId, env, {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? refreshToken,
    expiresIn: refreshed.expires_in,
  });

  return refreshed.access_token;
}

async function getUserClerkId(db: Db, userId: string) {
  const [user] = await db
    .select({ clerkId: users.clerkId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.clerkId ?? null;
}

export async function syncGoogleTokensFromClerk(
  db: Db,
  userId: string,
  env: Bindings,
  connectedFromPath?: string | null,
): Promise<string | null> {
  if (isGoogleDemoShared(env)) {
    const existingToken = await getGoogleAccessToken(db, userId, env);
    if (existingToken) {
      return existingToken;
    }
  }

  const secretKey = env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    return null;
  }

  const clerkId = await getUserClerkId(db, userId, env);
  if (!clerkId) {
    return null;
  }

  const clerkToken = await fetchGoogleTokenFromClerk(clerkId, secretKey);
  if (!clerkToken) {
    return null;
  }

  const tokenUserId = await resolveTokenUserId(db, userId, env);
  await saveGoogleTokens(db, tokenUserId, env, {
    accessToken: clerkToken.accessToken,
    expiresIn: clerkToken.expiresIn,
  });

  if (connectedFromPath) {
    await saveInitialGoogleConnectedFromPath(db, tokenUserId, connectedFromPath);
  }

  return clerkToken.accessToken;
}

export async function ensureGoogleAccessToken(
  db: Db,
  userId: string,
  env: Bindings,
  connectedFromPath?: string | null,
): Promise<string | null> {
  const existingToken = await getGoogleAccessToken(db, userId, env);
  if (existingToken) {
    return existingToken;
  }

  const tokenUserId = await resolveTokenUserId(db, userId, env);
  if (isGoogleDemoShared(env) && tokenUserId !== userId) {
    return null;
  }

  return syncGoogleTokensFromClerk(db, userId, env, connectedFromPath);
}

export async function hasGoogleConnection(db: Db, userId: string, env: Bindings) {
  const tokenUserId = await resolveTokenUserId(db, userId, env);
  const [user] = await db
    .select({ encryptedGoogleAccessToken: users.encryptedGoogleAccessToken })
    .from(users)
    .where(eq(users.id, tokenUserId))
    .limit(1);

  return Boolean(user?.encryptedGoogleAccessToken);
}

export async function getGoogleConnectionMeta(db: Db, userId: string, env: Bindings) {
  const tokenUserId = await resolveTokenUserId(db, userId, env);
  const [user] = await db
    .select({
      encryptedGoogleAccessToken: users.encryptedGoogleAccessToken,
      googleConnectedFromPath: users.googleConnectedFromPath,
    })
    .from(users)
    .where(eq(users.id, tokenUserId))
    .limit(1);

  return {
    connected: Boolean(user?.encryptedGoogleAccessToken),
    connectedFromPath: user?.googleConnectedFromPath ?? null,
  };
}

export async function saveInitialGoogleConnectedFromPath(
  db: Db,
  userId: string,
  path: string,
) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    return;
  }

  const [user] = await db
    .select({ googleConnectedFromPath: users.googleConnectedFromPath })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.googleConnectedFromPath) {
    return;
  }

  await db
    .update(users)
    .set({
      googleConnectedFromPath: path,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function clearGoogleTokens(
  db: Db,
  userId: string,
  env: Bindings,
) {
  if (isGoogleDemoShared(env)) {
    return;
  }

  const [user] = await db
    .select({
      encryptedGoogleRefreshToken: users.encryptedGoogleRefreshToken,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.encryptedGoogleRefreshToken) {
    const encryptionKey = env.ENCRYPTION_KEY ?? "";
    const refreshToken = await decryptToken(
      user.encryptedGoogleRefreshToken,
      encryptionKey,
    );

    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refreshToken }).toString(),
    }).catch(() => undefined);
  }

  await db
    .update(users)
    .set({
      encryptedGoogleAccessToken: null,
      encryptedGoogleRefreshToken: null,
      googleTokenExpiry: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
