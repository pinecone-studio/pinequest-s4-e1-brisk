"use client";

import { isGoogleDemoShared } from "@/lib/google/demo-google";
import {
  CLERK_GOOGLE_ADDITIONAL_SCOPES,
  hasGoogleCalendarEventsScope,
} from "@/lib/google/google-oauth-scopes";
import {
  getGoogleWorkspaceStatus,
  syncGoogleWorkspaceFromClerk,
} from "@/lib/api/google-workspace";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const REAUTH_ATTEMPT_KEY = "google_calendar_scope_reauth_attempted";

function getGoogleExternalAccount(user: NonNullable<ReturnType<typeof useUser>["user"]>) {
  return user.externalAccounts.find(
    (account) => account.provider === "google" || account.provider === "oauth_google",
  );
}

export function GoogleCalendarScopeBridge() {
  const { user, isLoaded } = useUser();
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (isGoogleDemoShared()) {
      return;
    }

    if (!isLoaded || !user || isRunningRef.current) {
      return;
    }

    const googleAccount = getGoogleExternalAccount(user);
    if (!googleAccount) {
      return;
    }

    if (hasGoogleCalendarEventsScope(googleAccount.approvedScopes)) {
      sessionStorage.removeItem(REAUTH_ATTEMPT_KEY);
      return;
    }

    if (sessionStorage.getItem(REAUTH_ATTEMPT_KEY) === "1") {
      return;
    }

    isRunningRef.current = true;

    void (async () => {
      try {
        const status = await getGoogleWorkspaceStatus();
        if (status.connected) {
          sessionStorage.removeItem(REAUTH_ATTEMPT_KEY);
          return;
        }

        const synced = await syncGoogleWorkspaceFromClerk();
        if (synced.connected) {
          sessionStorage.removeItem(REAUTH_ATTEMPT_KEY);
          return;
        }

        sessionStorage.setItem(REAUTH_ATTEMPT_KEY, "1");
        await googleAccount.reauthorize({
          additionalScopes: [...CLERK_GOOGLE_ADDITIONAL_SCOPES],
          redirectUrl: `${window.location.origin}/sso-callback`,
        });
      } catch {
        // Fall back to the Brisk Google OAuth flow if Clerk reauthorization fails.
      } finally {
        isRunningRef.current = false;
      }
    })();
  }, [isLoaded, user]);

  return null;
}
