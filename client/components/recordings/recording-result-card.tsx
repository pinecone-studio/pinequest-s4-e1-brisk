"use client";

import {
  deleteRecording,
  downloadRecording,
} from "@/app/recordings/api/recordings-api";
import { useRecordingStatus } from "@/app/recordings/hooks/use-recording-status";
import type { StandaloneRecording } from "@/app/recordings/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMeetingDateLong } from "@/lib/meetings/format-meeting-date";
import {
  getMockStandupDetailHref,
  isMockStandupRecording,
} from "@/lib/meetings/mock-standup-story";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import {
  formatRecordingDuration,
  formatRecordingFileSize,
} from "@/lib/recordings/format-recording";
import {
  formatBackendErrorMessage,
  displayUserError,
  formatUserError,
} from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  FolderIcon,
  HardDriveIcon,
  MoreVerticalIcon,
  RadioIcon,
  SparklesIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type RecordingResultCardProps = {
  recording: StandaloneRecording;
  onDeleted?: () => void;
};

const getRecordingPreview = (recording: StandaloneRecording) => {
  if (recording.status === "failed" && recording.errorMessage) {
    return formatBackendErrorMessage(recording.errorMessage);
  }

  if (recording.keyPoints?.[0]) return recording.keyPoints[0];

  if (recording.transcript?.trim()) {
    return recording.transcript.trim();
  }

  if (recording.status === "processing" || recording.status === "pending") {
    return "Processing your recording…";
  }

  return null;
};

export function RecordingResultCard({
  recording: initialRecording,
  onDeleted,
}: RecordingResultCardProps) {
  const { recording } = useRecordingStatus(
    initialRecording.id,
    initialRecording,
  );
  const [actionError, setActionError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const current = recording ?? initialRecording;
  const isMock = isMockStandupRecording(current.id);
  const detailHref = getMockStandupDetailHref(current.id);
  const status = TRANSCRIPTION_STATUS_STYLES[current.status];
  const preview = getRecordingPreview(current);
  const hasSummary = Boolean(current.keyPoints && current.keyPoints.length > 0);
  const durationLabel = formatRecordingDuration(current.durationSeconds);
  const fileSizeLabel = formatRecordingFileSize(current.fileSizeBytes);

  const handleDownload = async () => {
    if (isMock) return;
    setActionError("");
    setIsDownloading(true);

    try {
      await downloadRecording(current.id, current.title);
    } catch (caughtError) {
      setActionError(formatUserError(caughtError));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (isMock) return;
    if (!window.confirm("Delete this recording? This cannot be undone.")) return;

    setActionError("");
    setIsDeleting(true);

    try {
      await deleteRecording(current.id);
      onDeleted?.();
    } catch (caughtError) {
      setActionError(formatUserError(caughtError));
      setIsDeleting(false);
    }
  };

  return (
    <Link
      href={detailHref}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card className="cursor-pointer ring-1 ring-foreground/10 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate font-heading text-base font-semibold text-foreground group-hover:text-primary">
              {current.title}
            </h3>

            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground">
                <FolderIcon className="size-3" />
                Voice recordings
              </Badge>

              {!isMock ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label="More options"
                    disabled={isDeleting || isDownloading}
                    onClick={(event) => event.preventDefault()}
                  >
                    <MoreVerticalIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={detailHref} />}>
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(event) => {
                        event.preventDefault();
                        void handleDownload();
                      }}
                    >
                      <DownloadIcon />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(event) => {
                        event.preventDefault();
                        void handleDelete();
                      }}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {formatMeetingDateLong(
              current.createdAt != null ? String(current.createdAt) : null,
            )}
          </span>
          {durationLabel ? (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              {durationLabel}
            </span>
          ) : null}
          {fileSizeLabel ? (
            <span className="flex items-center gap-1.5">
              <HardDriveIcon className="size-3.5" />
              {fileSizeLabel}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <RadioIcon className="size-3.5" />
            Recording
          </span>
          <Badge className={cn("gap-1", status.className)}>{status.label}</Badge>
        </div>

        {preview ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {hasSummary ? (
              <Badge className="gap-1 bg-sage text-sage-foreground">
                <SparklesIcon className="size-3" />
                AI summary
              </Badge>
            ) : null}
            <Badge className="gap-1 bg-tag-yellow text-tag-yellow-foreground">
              <UsersIcon className="size-3" />
              Speakers: {current.speakerCount ?? 0}
            </Badge>
          </div>
        </div>

        {actionError ? (
          <p className="text-xs text-destructive">{displayUserError(actionError)}</p>
        ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
