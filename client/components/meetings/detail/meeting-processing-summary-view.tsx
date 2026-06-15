"use client";

import type { MeetingAttendee } from "@/app/meeting";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleBackLink } from "@/components/ui/circle-back-link";
import { memberInitials } from "@/lib/onboarding-utils";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";
import {
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  Loader2Icon,
  MailCheckIcon,
} from "lucide-react";

type MeetingProcessingSummaryViewProps = {
  title: string;
  createdDate: string | null;
  durationLabel: string | null;
  googleDocUrl: string | null;
  attendees: MeetingAttendee[];
};

export function MeetingProcessingSummaryView({
  title,
  createdDate,
  durationLabel,
  googleDocUrl,
  attendees,
}: MeetingProcessingSummaryViewProps) {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <header className="relative z-10 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-zinc-100 px-4 py-4 dark:border-white/5 lg:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <CircleBackLink href="/meetings" label="Back to meetings" className="-ml-0.5 rounded-full" />
          <h1 className="font-heading text-xl font-semibold text-foreground lg:text-2xl">{title}</h1>
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
            <Badge variant="secondary">Completed</Badge>
          </div>
        </div>

        {googleDocUrl ? (
          <Button
            size="sm"
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/80"
            render={<a href={googleDocUrl} target="_blank" rel="noreferrer" />}
          >
            <FileTextIcon />
            Open meeting summary
          </Button>
        ) : null}
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-6 scrollbar-none lg:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              {googleDocUrl ? (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileTextIcon className="size-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Your meeting summary is ready</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We generated a Google Doc with the meeting recap and shared it with attendees.
                    </p>
                  </div>
                  <Button
                    className="gap-1.5"
                    render={<a href={googleDocUrl} target="_blank" rel="noreferrer" />}
                  >
                    <FileTextIcon />
                    Open in Google Docs
                  </Button>
                </>
              ) : (
                <>
                  <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Generating your meeting summary…</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This usually takes a moment. The summary will appear here automatically once it&apos;s ready.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {attendees.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Attendees</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarImage src={getEmailAvatarUrl(attendee.email)} alt={attendee.name} />
                      <AvatarFallback>{memberInitials(attendee.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">{attendee.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{attendee.email}</span>
                    </div>
                    {googleDocUrl ? (
                      <Badge variant="outline" className="ml-auto gap-1">
                        <MailCheckIcon className="size-3" />
                        Notified
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
