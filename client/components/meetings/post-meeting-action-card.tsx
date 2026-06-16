"use client";

import type { MeetingDetailsActionItem } from "@/app/meeting";
import { updateMeeting } from "@/app/meeting/api/update-meeting";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { createGoogleCalendarEvent } from "@/lib/api/google-workspace";
import { saveLocalCalendarEvent } from "@/lib/home/local-calendar-events";
import { createTasksBatch } from "@/lib/api/tasks";
import {
  buildDefaultFollowUpDate,
  buildDefaultRecordingName,
  fromDateTimeLocalValue,
  toCalendarDateTime,
  toDateTimeLocalValue,
} from "@/lib/meetings/build-default-recording-name";
import { findBriskTeamMemberByName } from "@/lib/meetings/brisk-standup-team";
import { displayUserError, formatUserError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import {
  CalendarClockIcon,
  CheckSquareIcon,
  ClipboardListIcon,
  Loader2Icon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PostMeetingFormState,
  PostMeetingTask,
  PostMeetingTeammateOption,
} from "./post-meeting-action-card.types";

type PostMeetingActionCardProps = {
  meetingId: string;
  initialTitle?: string;
  actionItems: MeetingDetailsActionItem[];
  teammates: PostMeetingTeammateOption[];
  open: boolean;
  onDismiss: () => void;
  onSaved?: () => void;
};

function buildInitialTasks(actionItems: MeetingDetailsActionItem[]): PostMeetingTask[] {
  return actionItems.map((item, index) => {
    const member = findBriskTeamMemberByName(item.owner);

    return {
      id: `task-${index}-${item.action.slice(0, 12)}`,
      text: item.action,
      assignedTo: member?.id ?? "",
      enabled: true,
    };
  });
}

const UNASSIGNED_TEAMMATE_ID = "__unassigned__";

function TeammateSelect({
  value,
  onChange,
  teammates,
  disabled,
  placeholder = "Assign teammate",
  size = "default",
  allowUnassigned = false,
}: {
  value: string;
  onChange: (value: string) => void;
  teammates: PostMeetingTeammateOption[];
  disabled?: boolean;
  placeholder?: string;
  size?: "sm" | "default";
  allowUnassigned?: boolean;
}) {
  const selectValue = value || (allowUnassigned ? UNASSIGNED_TEAMMATE_ID : null);

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        if (!next || next === UNASSIGNED_TEAMMATE_ID) {
          onChange("");
          return;
        }
        onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger size={size} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowUnassigned ? (
          <SelectItem value={UNASSIGNED_TEAMMATE_ID}>Unassigned</SelectItem>
        ) : null}
        {teammates.map((teammate) => (
          <SelectItem key={teammate.id} value={teammate.id}>
            {teammate.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PostMeetingActionCard({
  meetingId,
  initialTitle,
  actionItems,
  teammates,
  open,
  onDismiss,
  onSaved,
}: PostMeetingActionCardProps) {
  const defaultRecordingName = useMemo(
    () => initialTitle?.trim() || buildDefaultRecordingName(),
    [initialTitle],
  );

  const [form, setForm] = useState<PostMeetingFormState>(() => ({
    recordingName: defaultRecordingName,
    assignedTeammateId: teammates[0]?.id ?? "",
    scheduleFollowUp: false,
    followUpDate: buildDefaultFollowUpDate(),
    tasks: buildInitialTasks(actionItems),
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsVisible(false);
      return;
    }

    setForm({
      recordingName: defaultRecordingName,
      assignedTeammateId: teammates[0]?.id ?? "",
      scheduleFollowUp: false,
      followUpDate: buildDefaultFollowUpDate(),
      tasks: buildInitialTasks(actionItems),
    });
    setError("");

    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [actionItems, defaultRecordingName, open, teammates]);

  const enabledTaskCount = form.tasks.filter((task) => task.enabled).length;

  const updateTask = useCallback((taskId: string, patch: Partial<PostMeetingTask>) => {
    setForm((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      ),
    }));
  }, []);

  const handleSave = async () => {
    const recordingName = form.recordingName.trim();
    if (!recordingName) {
      setError("Add a recording name before saving.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await updateMeeting(meetingId, {
        title: recordingName,
        assignedTeammateId: form.assignedTeammateId || undefined,
      });

      if (form.scheduleFollowUp) {
        const followUpStart = form.followUpDate;
        const followUpEnd = new Date(followUpStart);
        followUpEnd.setHours(followUpEnd.getHours() + 1);

        const assignedTeammate = teammates.find(
          (teammate) => teammate.id === form.assignedTeammateId,
        );

        const calendarInput = {
          summary: `${recordingName} – Follow-up`,
          startDateTime: toCalendarDateTime(followUpStart),
          endDateTime: toCalendarDateTime(followUpEnd),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          attendeeEmails: assignedTeammate?.email ? [assignedTeammate.email] : undefined,
        };

        try {
          await createGoogleCalendarEvent(calendarInput);
        } catch {
          saveLocalCalendarEvent(calendarInput);
        }
      }

      const enabledTasks = form.tasks.filter(
        (task) => task.enabled && task.text.trim().length > 0,
      );

      if (enabledTasks.length > 0) {
        await createTasksBatch(
          enabledTasks.map((task) => ({
            title: task.text.trim(),
            assigneeId: task.assignedTo || undefined,
            meetingId,
          })),
        );
      }

      onSaved?.();
      onDismiss();
    } catch (caughtError) {
      setError(formatUserError(caughtError));
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-meeting-action-title"
    >
      <button
        type="button"
        aria-label="Dismiss post-meeting actions"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        disabled={isLoading}
        onClick={onDismiss}
      />

      <div
        className={cn(
          "relative flex max-h-[min(90vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/5 transition-all duration-500 ease-out",
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0 sm:translate-y-2",
        )}
      >
        <div className="border-b border-border/70 bg-muted/20 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SparklesIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="post-meeting-action-title"
                className="font-heading text-lg font-semibold text-foreground"
              >
                Post-meeting actions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review AI-generated tasks, assign ownership, and sync everything to your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-6">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <UserRoundIcon className="size-4 text-muted-foreground" />
                Meta configuration
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="recording-name">Recording name</Label>
                  <Input
                    id="recording-name"
                    value={form.recordingName}
                    disabled={isLoading}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recordingName: event.target.value,
                      }))
                    }
                    placeholder="Recording name"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="assigned-teammate">Assign meeting record</Label>
                  <TeammateSelect
                    value={form.assignedTeammateId}
                    onChange={(assignedTeammateId) =>
                      setForm((current) => ({ ...current, assignedTeammateId }))
                    }
                    teammates={teammates}
                    disabled={isLoading}
                    placeholder="Select a teammate"
                  />
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CalendarClockIcon className="size-4 text-muted-foreground" />
                  Smart scheduling
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="schedule-follow-up" className="text-sm font-normal text-muted-foreground">
                    Schedule follow-up meeting
                  </Label>
                  <Switch
                    id="schedule-follow-up"
                    checked={form.scheduleFollowUp}
                    disabled={isLoading}
                    onCheckedChange={(scheduleFollowUp) =>
                      setForm((current) => ({ ...current, scheduleFollowUp: Boolean(scheduleFollowUp) }))
                    }
                  />
                </div>
              </div>

              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  form.scheduleFollowUp
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <Label htmlFor="follow-up-date">Follow-up date & time</Label>
                    <Input
                      id="follow-up-date"
                      type="datetime-local"
                      value={toDateTimeLocalValue(form.followUpDate)}
                      disabled={isLoading}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          followUpDate: fromDateTimeLocalValue(event.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ClipboardListIcon className="size-4 text-muted-foreground" />
                  AI-generated task review
                </div>
                <span className="text-xs text-muted-foreground">
                  {enabledTaskCount} of {form.tasks.length} selected
                </span>
              </div>

              {form.tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <CheckSquareIcon className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">No tasks generated</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You can still save the recording details and schedule a follow-up.
                  </p>
                </div>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {form.tasks.map((task) => (
                    <li
                      key={task.id}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-3 transition-opacity",
                        !task.enabled && "opacity-60",
                      )}
                    >
                      <Checkbox
                        checked={task.enabled}
                        disabled={isLoading}
                        onCheckedChange={(checked) =>
                          updateTask(task.id, { enabled: Boolean(checked) })
                        }
                        className="mt-1"
                      />
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
                        <Input
                          value={task.text}
                          disabled={isLoading || !task.enabled}
                          onChange={(event) =>
                            updateTask(task.id, { text: event.target.value })
                          }
                          className="h-9"
                        />
                        <TeammateSelect
                          value={task.assignedTo}
                          onChange={(assignedTo) => updateTask(task.id, { assignedTo })}
                          teammates={teammates}
                          disabled={isLoading || !task.enabled}
                          placeholder="Assign"
                          size="sm"
                          allowUnassigned
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {displayUserError(error)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onDismiss}
          >
            Dismiss
          </Button>
          <Button type="button" disabled={isLoading} onClick={() => void handleSave()}>
            {isLoading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save & Sync"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
