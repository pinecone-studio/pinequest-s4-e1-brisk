"use client";

import { clearGoogleOAuthRedirectAttempt } from "@/lib/api/google-workspace";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function GoogleOAuthRedirectCleanup() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!searchParams.get("google_connected") && !searchParams.get("google_error")) {
      return;
    }

    if (searchParams.get("google_connected")) {
      clearGoogleOAuthRedirectAttempt();
    }

    router.replace(pathname);
  }, [pathname, router, searchParams]);

  return null;
}
