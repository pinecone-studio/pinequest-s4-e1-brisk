"use client";

import { UserSync } from "@/components/user-sync";
import { GoogleCalendarScopeBridge } from "@/components/google-calendar-scope-bridge";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";

/** Attaches Clerk JWT to API requests and syncs the user into Brisk DB. */
export function ClientAuthSetup() {
  useClientApiAuth();
  return (
    <>
      <UserSync />
      <GoogleCalendarScopeBridge />
    </>
  );
}
