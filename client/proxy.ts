import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Root auth + redirect logic runs in proxy.ts (Next.js 16 convention).
 * OpenNext Cloudflare still reads `.next/server/middleware-manifest.json`;
 * patch-handler-middleware.mjs inlines that manifest at deploy time.
 */
export default clerkMiddleware(async (auth, req) => {
  // Resolve the root redirect here instead of in app/page.tsx. A server
  // component calling redirect() interrupts rendering, which triggers a
  // dev-only React "negative time stamp" performance.measure error.
  if (req.nextUrl.pathname === "/") {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    let target = "/home";

    try {
      const token = await getToken();
      if (token) {
        const apiUrl = (
          process.env.MEETING_API_URL ??
          process.env.API_URL ??
          process.env.NEXT_PUBLIC_API_URL ??
          "http://localhost:8787"
        ).replace(/\/$/, "");

        const response = await fetch(`${apiUrl}/api/google/status`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(3_000),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            connectedFromPath?: string | null;
          };

          if (
            typeof data.connectedFromPath === "string" &&
            data.connectedFromPath.startsWith("/") &&
            !data.connectedFromPath.startsWith("//")
          ) {
            target = data.connectedFromPath;
          }
        }
      }
    } catch {
      // Fall back to the default dashboard entry.
    }

    return NextResponse.redirect(new URL(target, req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
