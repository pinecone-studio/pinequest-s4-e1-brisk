"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateCalendarEventInput } from "@/lib/home/agenda-types";
import {
  isGoogleScopeError,
  reconnectGoogleWorkspace,
} from "@/lib/api/google-workspace";
import { formatDayHeading, getDateKey } from "@/lib/home/google-agenda-utils";
import { cn } from "@/lib/utils";
import { Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type CreateCalendarEventPanelProps = {
  date: Date;
  onClose: () => void;
  onCreate: (input: CreateCalendarEventInput) => Promise<void>;
  className?: string;
};

function buildLocalDateTime(date: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);

  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  const hour = String(next.getHours()).padStart(2, "0");
  const minute = String(next.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

function parseGuestEmails(value: string) {
  return value
    .split(/[,;\n]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function CreateCalendarEventPanel({
  date,
  onClose,
  onCreate,
  className,
}: CreateCalendarEventPanelProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [guests, setGuests] = useState("");
  const [error, setError] = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    setTitle("");
    setStartTime("09:00");
    setEndTime("10:00");
    setGuests("");
    setError("");
    setNeedsReconnect(false);
  }, [date]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const summary = title.trim();
    if (!summary) {
      setError("Add a title for the event.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNeedsReconnect(false);

    try {
      await onCreate({
        summary,
        startDateTime: buildLocalDateTime(date, startTime),
        endDateTime: buildLocalDateTime(date, endTime),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendeeEmails: parseGuestEmails(guests),
      });
      onClose();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create the event.";
      setError(message);
      setNeedsReconnect(isGoogleScopeError(message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "z-50 w-full rounded-xl border border-border bg-card p-4 text-foreground shadow-xl ring-1 ring-border/60",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">Create event</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDayHeading(getDateKey(date))}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 rounded-full"
          onClick={onClose}
          aria-label="Close"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add title"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-start">Start</Label>
            <Input
              id="event-start"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-end">End</Label>
            <Input
              id="event-end"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-guests">Guests</Label>
          <Input
            id="event-guests"
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            placeholder="email@example.com"
          />
          <p className="text-[11px] text-muted-foreground">
            Invited guests receive a Google Calendar invite.
          </p>
        </div>

        {error ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-destructive">{error}</p>
            {needsReconnect ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={isReconnecting}
                onClick={() => {
                  setIsReconnecting(true);
                  void reconnectGoogleWorkspace("/home");
                }}
              >
                {isReconnecting ? "Redirecting…" : "Reconnect Google"}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
