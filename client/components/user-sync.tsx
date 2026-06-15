"use client";

import { seedDemoStandupAccount, syncClerkUser } from "@/lib/api/users";
import { syncGoogleWorkspaceFromClerk } from "@/lib/api/google-workspace";
import { isGoogleDemoShared } from "@/lib/google/demo-google";
import { setClerkProfile } from "@/lib/meetings/clerk-profile";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) {
      setClerkProfile(null);
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

    setClerkProfile({
      clerkId: user.id,
      email,
      name,
      avatarUrl: user.imageUrl ?? null,
      internalUserId: null,
    });

    syncClerkUser({
      clerkId: user.id,
      email,
      name,
      avatarUrl: user.imageUrl ?? null,
    })
      .then(async (syncedUser) => {
        setClerkProfile({
          clerkId: user.id,
          email,
          name,
          avatarUrl: user.imageUrl ?? null,
          internalUserId: syncedUser.id,
        });

        await seedDemoStandupAccount().catch(() => {});

        if (isGoogleDemoShared()) {
          return null;
        }

        return syncGoogleWorkspaceFromClerk();
      })
      .catch(() => {
        syncedRef.current = null;
        setClerkProfile(null);
      });
  }, [isLoaded, user]);

  return null;
}
