"use client";

import { Button } from "@/components/ui/button";
import { CircleBackLink } from "@/components/ui/circle-back-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  CalendarIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  FileTextIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlayCircleIcon,
  RadioIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type MeetingDetailTopbarProps = {
  meetingId: string;
  title: string;
  createdDate: string | null;
  durationLabel: string | null;
  transcript: string | null;
  audioUrl: string | null;
  roomName: string | null;
  summaryView?: boolean;
  isEditingTitle?: boolean;
  onTitleChange?: (title: string) => void;
  onStartEditTitle?: () => void;
  onFinishEditTitle?: () => void;
  onOpenGoogleDocs?: () => void;
};

export const MeetingDetailTopbar = ({
  meetingId,
  title,
  createdDate,
  durationLabel,
  transcript,
  audioUrl,
  roomName,
  summaryView = false,
  isEditingTitle = false,
  onTitleChange,
  onStartEditTitle,
  onFinishEditTitle,
  onOpenGoogleDocs,
}: MeetingDetailTopbarProps) => {
  const toast = useToast();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isRecording = title === "Instant Meeting";

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleDownloadTranscript = () => {
    if (!transcript) return;

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${title.trim().toLowerCase().replace(/\s+/g, "-")}-transcript.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);

    toast.add({
      title: "Link copied",
      description: "The meeting link has been copied to your clipboard.",
      type: "success",
    });
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onFinishEditTitle?.();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onFinishEditTitle?.();
    }
  };

  return (
    <header className="relative z-10 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-zinc-100 px-4 py-4 dark:border-white/5 lg:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <CircleBackLink href="/meetings" label="Back to meetings" className="-ml-0.5 rounded-full" />
        {summaryView && isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(event) => onTitleChange?.(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={() => onFinishEditTitle?.()}
            className="h-10 max-w-xl font-heading text-lg font-semibold lg:text-xl"
            aria-label="Meeting title"
          />
        ) : (
          <h1
            className={cn(
              "font-heading text-xl font-semibold text-foreground lg:text-2xl",
              summaryView && "cursor-text rounded-lg transition-colors hover:bg-muted/40",
            )}
            onDoubleClick={summaryView ? () => onStartEditTitle?.() : undefined}
            title={summaryView ? "Double-click to edit title" : undefined}
          >
            {title}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {createdDate ? (
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-4" />
              {createdDate}
            </span>
          ) : null}
          {durationLabel ? (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              {durationLabel}
            </span>
          ) : null}
          {isRecording ? (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              <RadioIcon className="size-3.5" />
              Recording
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {summaryView ? (
          <Button
            size="sm"
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/80"
            onClick={onOpenGoogleDocs}
          >
            <FileTextIcon />
            Open in Google Docs
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={handleDownloadTranscript}
              disabled={!transcript}
              aria-label="Download transcript"
            >
              <DownloadIcon />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label="More options"
              >
                <MoreHorizontalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <CopyIcon />
                  Copy meeting link
                </DropdownMenuItem>
                {audioUrl ? (
                  <DropdownMenuItem render={<a href={audioUrl} target="_blank" rel="noreferrer" />}>
                    <PlayCircleIcon />
                    Open recording
                  </DropdownMenuItem>
                ) : null}
                {roomName ? (
                  <DropdownMenuItem
                    render={<Link href={`/meeting?meetingId=${meetingId}&roomName=${roomName}`} />}
                  >
                    <VideoIcon />
                    Rejoin room
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              disabled
              title="Editing isn't available yet"
              aria-label="Edit meeting"
            >
              <PencilIcon />
            </Button>

            <Button
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/80"
              render={<a href="https://docs.google.com/document/create" target="_blank" rel="noreferrer" />}
            >
              <FileTextIcon />
              Open in Google Docs
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
