"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { getEmailAvatarSources } from "@/lib/user/email-avatar-sources";
import { useMemo, useState } from "react";

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
  const sources = useMemo(
    () => getEmailAvatarSources(email, 150, avatarUrl),
    [avatarUrl, email],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex];

  return (
    <Avatar className={className} size={size}>
      {src ? (
        <AvatarImage
          alt={name}
          src={src}
          onError={() => {
            setSourceIndex((current) =>
              current + 1 < sources.length ? current + 1 : current,
            );
          }}
        />
      ) : null}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
