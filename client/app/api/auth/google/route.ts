import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GOOGLE_WORKSPACE_OAUTH_SCOPES } from "@/lib/google/google-oauth-scopes";

const SCOPES = GOOGLE_WORKSPACE_OAUTH_SCOPES.join(" ");

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

function getBaseUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function getRedirectUri(baseUrl: string): string {
  const { hostname } = new URL(baseUrl);
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${baseUrl}/api/auth/google/callback`;
  }
  return `${baseUrl}/api/auth/google`;
}

function withQuery(path: string, query: string) {
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (code !== null || errorParam !== null) {
    return handleCallback(request, url, code, state, errorParam);
  }

  return handleInitiation(request, url);
}

async function handleInitiation(request: Request, url: URL) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return Response.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  const returnTo = url.searchParams.get("returnTo")?.startsWith("/")
    ? url.searchParams.get("returnTo")!
    : "/home";

  const baseUrl = getBaseUrl(request);
  const redirectUri = getRedirectUri(baseUrl);
  const stateValue = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(
    "google_workspace_oauth_state",
    JSON.stringify({ state: stateValue, returnTo }),
    {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    },
  );

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", stateValue);

  redirect(authUrl.toString());
}

async function handleCallback(
  request: Request,
  url: URL,
  code: string | null,
  state: string | null,
  errorParam: string | null,
) {
  const cookieStore = await cookies();
  const savedRaw = cookieStore.get("google_workspace_oauth_state")?.value;
  let returnTo = "/home";

  if (errorParam) {
    return redirect(withQuery(returnTo, `google_error=${encodeURIComponent(errorParam)}`));
  }

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  if (!savedRaw) {
    return redirect(withQuery(returnTo, "google_error=missing_state"));
  }

  let parsed: { state: string; returnTo?: string };
  try {
    parsed = JSON.parse(savedRaw) as { state: string; returnTo?: string };
  } catch {
    return redirect(withQuery(returnTo, "google_error=invalid_state"));
  }

  if (parsed.returnTo?.startsWith("/")) {
    returnTo = parsed.returnTo;
  }

  if (!parsed.state || parsed.state !== state) {
    return redirect(withQuery(returnTo, "google_error=state_mismatch"));
  }

  cookieStore.delete("google_workspace_oauth_state");

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirect(withQuery(returnTo, "google_error=missing_client_credentials"));
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = getRedirectUri(baseUrl);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    console.error("[google callback] token exchange failed:", await tokenRes.text());
    return redirect(withQuery(returnTo, "google_error=token_exchange_failed"));
  }

  const tokens = (await tokenRes.json()) as GoogleTokenResponse;
  const session = await auth();
  const clerkToken = await session.getToken();

  if (!clerkToken) {
    return redirect(withQuery(returnTo, "google_error=not_signed_in"));
  }

  const apiUrl = (
    process.env.MEETING_API_URL ??
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8787"
  ).replace(/\/$/, "");

  const saveRes = await fetch(`${apiUrl}/api/google/oauth/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clerkToken}`,
    },
    body: JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresIn: tokens.expires_in,
      connectedFromPath: returnTo,
    }),
  });

  if (!saveRes.ok) {
    console.error("[google callback] save tokens failed:", await saveRes.text());
    return redirect(withQuery(returnTo, "google_error=save_failed"));
  }

  redirect(withQuery(returnTo, "google_connected=1"));
}
