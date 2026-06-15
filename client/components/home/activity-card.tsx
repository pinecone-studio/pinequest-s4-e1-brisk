import type { MeetingListItem } from "@/app/meeting";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CARD_STANDARD, TEXT_MUTED, TEXT_PRIMARY } from "@/lib/ui/design-tokens";
import { formatMeetingDate } from "@/lib/meetings/format-meeting-date";
import { getMeetingDurationLabel } from "@/lib/meetings/meeting-duration";
import { getMeetingParticipants } from "@/lib/meetings/meeting-participants";
import { TRANSCRIPTION_STATUS_STYLES } from "@/lib/meetings/transcription-status";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  MoreVerticalIcon,
  RadioIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";

type ActivityCardProps = {
  meeting: MeetingListItem;
};

export function ActivityCard({ meeting }: ActivityCardProps) {
  const status = TRANSCRIPTION_STATUS_STYLES[meeting.transcriptionStatus ?? "none"];
  const isRecording = meeting.title === "Instant Meeting";
  const SourceIcon = isRecording ? RadioIcon : VideoIcon;
  const sourceLabel = isRecording ? "Recording" : "Video meeting";
  const durationLabel = getMeetingDurationLabel(meeting);
  const participants = getMeetingParticipants(meeting);

  return (
    <article className={cn(CARD_STANDARD, "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md")}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/meetings/${meeting.id}`} className="min-w-0 hover:underline">
            <h3 className={cn("truncate font-heading text-base font-semibold", TEXT_PRIMARY)}>
              {meeting.title}
            </h3>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <Badge className={cn("gap-1", status.className)}>{status.label}</Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                aria-label="More options"
              >
                <MoreVerticalIcon className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={`/meetings/${meeting.id}`} />}>
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className={cn("flex flex-wrap items-center gap-3 text-sm", TEXT_MUTED)}>
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-3.5" />
            {formatMeetingDate(meeting.createdAt)}
          </span>
          {durationLabel ? (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              {durationLabel}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <SourceIcon className="size-3.5" />
            {sourceLabel}
          </span>
        </div>

        {meeting.summaryPreview ? (
          <p className={cn("line-clamp-2 text-sm leading-relaxed", TEXT_MUTED)}>
            {meeting.summaryPreview}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {meeting.summaryPreview ? (
              <Badge className="gap-1 bg-sage text-sage-foreground">
                <SparklesIcon className="size-3" />
                AI summary
              </Badge>
            ) : null}
            <Badge className="gap-1 bg-tag-yellow text-tag-yellow-foreground">
              <UsersIcon className="size-3" />
              Participants: {participants.length}
            </Badge>
          </div>

          <AvatarStack users={participants} size="sm" max={3} />
        </div>
      </div>
    </article>
  );
}
