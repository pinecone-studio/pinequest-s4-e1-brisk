"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getGmailAvatarUrl } from "@/lib/user/email-avatar-url";

type EmailAvatarProps = {
  email: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function EmailAvatar({
  email,
  name,
  initials,
  avatarUrl,
  size = "default",
  className,
}: EmailAvatarProps) {
  const resolvedEmail = email.trim();
  const src =
    avatarUrl?.trim() ||
    (resolvedEmail ? getGmailAvatarUrl(resolvedEmail, 150) : null);

  return (
    <Avatar className={className} size={size}>
      {src ? (
        <AvatarImage alt={name} src={src} referrerPolicy="no-referrer" />
      ) : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
