"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEXT_MUTED } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import {
  EllipsisVertical,
  FlipHorizontal2,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import type { RefObject } from "react";
import type { BackgroundEffect } from "./use-media-preview";

const AUDIO_LEVEL_ACTIVE_THRESHOLD = 0.15;
const BACKGROUND_BLUR_FILTER = "blur(24px)";

type LobbyMirrorPreviewProps = {
  audioLevel: number;
  avatarUrl?: string;
  backgroundEffect: BackgroundEffect;
  cameraError: string | null;
  displayName: string;
  isCamActive: boolean;
  isMicActive: boolean;
  isMirrored: boolean;
  microphoneError: string | null;
  onSetBackgroundEffect: (effect: BackgroundEffect) => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleMirror: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const hudButtonClass = (isActive: boolean) =>
  cn(
    "flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white backdrop-blur-md transition-colors duration-200",
    isActive
      ? "bg-white/20 hover:bg-white/30 dark:bg-black/40 dark:hover:bg-black/50"
      : "bg-red-500 hover:bg-red-600",
  );

export function LobbyMirrorPreview({
  audioLevel,
  avatarUrl,
  backgroundEffect,
  cameraError,
  displayName,
  isCamActive,
  isMicActive,
  isMirrored,
  microphoneError,
  onToggleCamera,
  onToggleMicrophone,
  onToggleMirror,
  videoRef,
}: LobbyMirrorPreviewProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const statusMessage = cameraError ?? microphoneError;
  const isMicLevelActive =
    isMicActive && audioLevel >= AUDIO_LEVEL_ACTIVE_THRESHOLD;
  const isBackgroundBlurred = backgroundEffect === "blur";

  return (
    <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-sm dark:border-zinc-800">
      <video
        autoPlay
        className={cn(
          "h-full w-full object-cover transition-opacity duration-200",
          isCamActive ? "opacity-100" : "opacity-0",
        )}
        muted
        playsInline
        ref={videoRef}
        style={{
          filter: isBackgroundBlurred ? BACKGROUND_BLUR_FILTER : undefined,
          transform: isMirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {!isCamActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
          <Avatar className="size-24" size="lg">
            <AvatarImage alt={displayName} src={avatarUrl} />
            <AvatarFallback className="bg-zinc-800 text-2xl text-zinc-300">
              {initial}
            </AvatarFallback>
          </Avatar>
          <p className={cn("text-sm font-medium", TEXT_MUTED)}>Camera is turned off</p>
        </div>
      ) : null}

      <p className="absolute top-3 left-4 text-sm font-medium text-white drop-shadow-sm">
        {displayName || "You"}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More options"
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          type="button"
        >
          <EllipsisVertical className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuCheckboxItem checked={isMirrored} onCheckedChange={onToggleMirror}>
            <FlipHorizontal2 className="size-4" />
            Mirror my video
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {statusMessage ? (
        <div className="absolute inset-x-6 top-12 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-300 ring-1 ring-red-500/20">
          {statusMessage}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <button
            aria-label={isMicActive ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={!isMicActive}
            className={cn(
              hudButtonClass(isMicActive),
              isMicLevelActive && "ring-2 ring-emerald-400/80",
            )}
            onClick={onToggleMicrophone}
            type="button"
          >
            {isMicActive ? <Mic className="size-[18px]" /> : <MicOff className="size-[18px]" />}
          </button>

          <button
            aria-label={isCamActive ? "Turn camera off" : "Turn camera on"}
            aria-pressed={!isCamActive}
            className={hudButtonClass(isCamActive)}
            onClick={onToggleCamera}
            type="button"
          >
            {isCamActive ? <Video className="size-[18px]" /> : <VideoOff className="size-[18px]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
