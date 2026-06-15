"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BTN_PRIMARY, TEXT_MUTED, TEXT_PRIMARY } from "@/lib/ui/design-tokens";
import { displayUserError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import { ChevronDown, Copy, Link2 } from "lucide-react";
import { useState } from "react";

const COPY_FEEDBACK_DURATION_MS = 1500;

type CopyTarget = "code" | "link";

type LobbyEntryPanelProps = {
  canJoin: boolean;
  error?: string;
  isJoining: boolean;
  occupancySubtitle: string;
  onJoin: () => void;
  roomCode: string;
  title: string;
};

export function LobbyEntryPanel({
  canJoin,
  error,
  isJoining,
  occupancySubtitle,
  onJoin,
  roomCode,
  title,
}: LobbyEntryPanelProps) {
  const [copiedItem, setCopiedItem] = useState<CopyTarget | null>(null);

  const handleCopy = async (item: CopyTarget) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    const value =
      item === "code"
        ? roomCode
        : typeof window !== "undefined"
          ? window.location.href
          : roomCode;

    await navigator.clipboard.writeText(value);
    setCopiedItem(item);
    window.setTimeout(() => {
      setCopiedItem((current) => (current === item ? null : current));
    }, COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6 text-center md:items-start md:text-left">
      <div className="w-full space-y-2">
        <h2 className={cn("text-3xl font-medium tracking-tight", TEXT_PRIMARY)}>
          {title}
        </h2>
        <p className={cn("text-base", TEXT_MUTED)}>{occupancySubtitle}</p>
      </div>

      <div className="w-full space-y-3">
        <Button
          className={cn(
            BTN_PRIMARY,
            "h-11 w-full bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400",
          )}
          disabled={!canJoin || isJoining}
          onClick={onJoin}
          type="button"
        >
          {isJoining ? "Joining..." : "Join now"}
        </Button>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {displayUserError(error)}
          </p>
        ) : null}
      </div>

      <div className="w-full">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              BTN_PRIMARY,
              "inline-flex w-full items-center justify-center gap-2 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
            )}
            type="button"
          >
            Other ways to join
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => void handleCopy("code")}>
              <Copy className="size-4" />
              {copiedItem === "code" ? "Code copied" : "Copy meeting code"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleCopy("link")}>
              <Link2 className="size-4" />
              {copiedItem === "link" ? "Link copied" : "Copy meeting link"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
