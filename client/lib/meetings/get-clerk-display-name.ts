import type { useUser } from "@clerk/nextjs";

export const getClerkPrimaryEmail = (user: ReturnType<typeof useUser>["user"]) => {
  if (!user) return "";
  return user.primaryEmailAddress?.emailAddress?.trim() ?? "";
};

/** Prefer the signed-in email for defaults; fall back to name when email is missing. */
export const getClerkDefaultDisplayName = (user: ReturnType<typeof useUser>["user"]) => {
  const email = getClerkPrimaryEmail(user);
  if (email) return email;

  return getClerkDisplayName(user);
};

export const getClerkDisplayName = (user: ReturnType<typeof useUser>["user"]) => {
  if (!user) return "";

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    getClerkPrimaryEmail(user) ||
    ""
  );
};

export const getClerkInitials = (value: string) =>
  value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
