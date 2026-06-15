import { auth } from "@clerk/nextjs/server";

const DEFAULT_ENTRY = "/home";

export async function resolveAppEntryPath(): Promise<string> {
  const { userId, getToken } = await auth();
  if (!userId) {
    return "/sign-in";
  }

  try {
    const token = await getToken();
    if (!token) {
      return DEFAULT_ENTRY;
    }

    const apiUrl = (
      process.env.MEETING_API_URL ??
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:8787"
    ).replace(/\/$/, "");

    const response = await fetch(`${apiUrl}/api/google/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_ENTRY;
    }

    const data = (await response.json()) as { connectedFromPath?: string | null };
    if (
      typeof data.connectedFromPath === "string" &&
      data.connectedFromPath.startsWith("/") &&
      !data.connectedFromPath.startsWith("//")
    ) {
      return data.connectedFromPath;
    }
  } catch {
    // Fall back to the default dashboard entry.
  }

  return DEFAULT_ENTRY;
}
