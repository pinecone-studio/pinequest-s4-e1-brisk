"use client";

import { syncClerkUser } from "@/lib/api/users";
import { syncGoogleWorkspaceFromClerk } from "@/lib/api/google-workspace";
import { isGoogleDemoShared } from "@/lib/google/demo-google";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      return;
    }

    if (syncedRef.current === user.id) {
      return;
    }

    const email = user.primaryEmailAddress?.emailAddress?.trim();
    const name = user.fullName?.trim() || user.firstName?.trim() || email;
    if (!email || !name) {
      return;
    }

    syncedRef.current = user.id;

    syncClerkUser({
      clerkId: user.id,
      email,
      name,
      avatarUrl: user.imageUrl ?? null,
    })
      .then(() => (isGoogleDemoShared() ? null : syncGoogleWorkspaceFromClerk()))
      .catch(() => {
        syncedRef.current = null;
      });
  }, [isLoaded, user]);

  return null;
}
