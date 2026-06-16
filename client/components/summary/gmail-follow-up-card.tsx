"use client";

import { Button } from "@/components/ui/button";
import { buildGmailComposeUrl } from "@/lib/summary/build-gmail-compose-url";
import { CalendarDaysIcon, ExternalLinkIcon, LinkIcon, ListTodoIcon, MailIcon, UserIcon } from "lucide-react";

type GmailFollowUpCardProps = {
  to: string;
  clientName: string;
  taskDescription: string;
  websiteLink: string;
};

export function GmailFollowUpCard({
  to,
  clientName,
  taskDescription,
  websiteLink,
}: GmailFollowUpCardProps) {
  const handleOpenGmail = () => {
    const url = buildGmailComposeUrl({ to, clientName, taskDescription, websiteLink });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/10">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MailIcon className="size-4.5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-snug text-foreground">Meeting Follow-up Email</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Opens a pre-filled draft in Gmail
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-foreground/5">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">To:</span>
          <span className="font-medium text-foreground">{clientName}</span>
          <span className="text-muted-foreground">({to})</span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <ListTodoIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Task:</span>
          <span className="line-clamp-2 font-medium text-foreground">{taskDescription}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">Link:</span>
          <span className="truncate font-medium text-foreground">{websiteLink}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <CalendarDaysIcon className="size-3.5" />
          Subject: Thank you for attending our meeting! 🚀
        </div>

        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-full px-4"
          onClick={handleOpenGmail}
        >
          <ExternalLinkIcon className="size-3.5" />
          Open in Gmail
        </Button>
      </div>
    </div>
  );
}
