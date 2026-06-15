type ClerkOauthAccessToken = {
  token?: string;
  expires_at?: number;
};

const CLERK_GOOGLE_PROVIDERS = ["oauth_google", "google"] as const;

export async function fetchGoogleTokenFromClerk(
  clerkUserId: string,
  secretKey: string,
): Promise<{ accessToken: string; expiresIn: number } | null> {
  for (const provider of CLERK_GOOGLE_PROVIDERS) {
    const response = await fetch(
      `https://api.clerk.com/v1/users/${clerkUserId}/oauth_access_tokens/${provider}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      continue;
    }

    const tokens = (await response.json()) as ClerkOauthAccessToken[];
    const activeToken = tokens.find((entry) => entry.token?.trim());
    if (!activeToken?.token) {
      continue;
    }

    const expiresAt = activeToken.expires_at ?? 0;
    const expiresIn =
      expiresAt > 0
        ? Math.max(60, expiresAt - Math.floor(Date.now() / 1000))
        : 3600;

    return {
      accessToken: activeToken.token,
      expiresIn,
    };
  }

  return null;
}
