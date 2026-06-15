import type { MeetingListItem } from "@/app/meeting";
import { AvatarStack } from "@/components/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <Link
      href={`/meetings/${meeting.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card className="cursor-pointer ring-1 ring-foreground/10 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 truncate font-heading text-base font-semibold text-foreground group-hover:text-primary">
              {meeting.title}
            </h3>

            <div className="flex shrink-0 items-center gap-2">
              <Badge className={cn("gap-1", status.className)}>{status.label}</Badge>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label="More options"
                  onClick={(event) => event.preventDefault()}
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

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
        </CardContent>
      </Card>
    </Link>
  );
}
