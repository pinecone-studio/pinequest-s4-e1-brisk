"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSummaryNoteDateTime } from "@/lib/summary/format-summary-note-date";
import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  CheckIcon,
  ClipboardListIcon,
  ClockIcon,
  Loader2Icon,
  MailIcon,
  PencilIcon,
  ScrollTextIcon,
  UserIcon,
} from "lucide-react";

type SummaryNoteCardProps = {
  note: SummaryNoteItem;
  highlighted?: boolean;
  approved: boolean;
  emailSent: boolean;
  isSendingEmail: boolean;
  assigneeEmail: string | null;
  onApprove: () => void;
  onSendEmail: () => void;
  onEdit: () => void;
};

export function SummaryNoteCard({
  note,
  highlighted = false,
  approved,
  emailSent,
  isSendingEmail,
  assigneeEmail,
  onApprove,
  onSendEmail,
  onEdit,
}: SummaryNoteCardProps) {
  const SourceIcon = note.source === "protocol" ? ScrollTextIcon : ClipboardListIcon;

  return (
    <article
      id={`summary-note-${note.id}`}
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-colors scroll-mt-24",
        approved && "bg-sage/20 ring-sage/30 dark:bg-sage/10",
        highlighted && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <SourceIcon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 flex-1 font-medium leading-snug text-foreground">
              {note.title}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 rounded-full text-muted-foreground"
              onClick={onEdit}
              aria-label="Edit note"
            >
              <PencilIcon className="size-3.5" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-lavender text-lavender-foreground">{note.meetingTitle}</Badge>
            <Badge
              className={cn(
                note.source === "protocol"
                  ? "bg-tag-yellow text-tag-yellow-foreground"
                  : "bg-sage text-sage-foreground",
              )}
            >
              {note.source === "protocol" ? "Protocol" : "Action item"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex min-w-[8rem] flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <UserIcon className="size-3.5" />
            Assignee
          </span>
          <span className="text-sm font-medium text-foreground">{note.assignee}</span>
          {assigneeEmail ? (
            <span className="text-xs text-muted-foreground">{assigneeEmail}</span>
          ) : null}
        </div>

        <div className="flex min-w-[10rem] flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDaysIcon className="size-3.5" />
            Date &amp; time
          </span>
          <span className="flex items-center gap-1.5 text-sm text-foreground">
            <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {formatSummaryNoteDateTime(note.dateTime)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant={approved ? "outline" : "default"}
            className={cn(
              "rounded-full px-4",
              approved &&
                "border-sage bg-sage/30 text-sage-foreground hover:bg-sage/40 dark:bg-sage/20",
            )}
            disabled={approved}
            onClick={onApprove}
          >
            {approved ? (
              <>
                <CheckIcon className="size-3.5" />
                Approved
              </>
            ) : (
              "Approve"
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={emailSent ? "outline" : "secondary"}
            className={cn(
              "rounded-full px-4",
              emailSent &&
                "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
            )}
            disabled={!approved || emailSent || isSendingEmail || !assigneeEmail}
            onClick={onSendEmail}
          >
            {isSendingEmail ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Sending…
              </>
            ) : emailSent ? (
              <>
                <CheckIcon className="size-3.5" />
                Email sent
              </>
            ) : (
              <>
                <MailIcon className="size-3.5" />
                Send email
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
