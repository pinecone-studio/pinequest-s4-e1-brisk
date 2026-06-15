"use client";

import { InviteEmailList } from "@/components/home/invite-email-list";
import { slugifyRoomName } from "@/app/meeting/utils/slugify-room-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { BTN_PRIMARY, CARD_STANDARD, TEXT_MUTED } from "@/lib/ui/design-tokens";
import { getClerkPrimaryEmail } from "@/lib/meetings/get-clerk-display-name";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  KeyboardIcon,
  Radio,
  TypeIcon,
  UploadCloudIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

type ActionTab = "meeting" | "recording" | "schedule";

const TABS: { id: ActionTab; label: string; icon: LucideIcon }[] = [
  { id: "meeting", label: "New meeting", icon: VideoIcon },
  { id: "recording", label: "Start instant recording", icon: Radio },
  { id: "schedule", label: "Schedule meeting", icon: CalendarDaysIcon },
];

export function QuickActions() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded } = useUser();
  const seededInviteEmailRef = useRef(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("meeting");

  const [meetingName, setMeetingName] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleInvites, setScheduleInvites] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (!isLoaded || !user || seededInviteEmailRef.current) return;

    const email = getClerkPrimaryEmail(user).toLowerCase();
    if (!email) return;

    seededInviteEmailRef.current = true;
    setInviteEmails((current) => (current.includes(email) ? current : [email]));
    setScheduleInvites((current) => (current.includes(email) ? current : [email]));
  }, [isLoaded, user]);

  const goToRecordings = (action?: "record" | "upload") => {
    router.push(action ? `/recordings?action=${action}` : "/recordings");
  };

  const handleScheduleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.add({
      title: "Meeting Scheduled",
      description: `${scheduleTitle} set for ${scheduleDate} from ${startTime} to ${endTime}${
        scheduleInvites.length ? ` · ${scheduleInvites.length} invite(s) queued` : ""
      }`,
      type: "success",
    });
  };

  const handleStartCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const meetingId = slugifyRoomName(meetingName) || `instant-${Date.now()}`;
    if (inviteEmails.length > 0) {
      toast.add({
        title: "Invites queued",
        description: `${inviteEmails.length} teammate${inviteEmails.length === 1 ? "" : "s"} will be invited when the room opens.`,
        type: "success",
      });
    }
    router.push(
      `/meeting?meetingId=${meetingId}&roomName=${meetingName || "Instant Meeting"}`,
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center gap-2 overflow-x-auto rounded-full bg-zinc-100/70 p-1.5 scrollbar-none dark:bg-zinc-800/80">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "recording") {
                  goToRecordings();
                }
              }}
              className={cn(
                "flex min-w-[160px] flex-1 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:min-w-0",
                isActive
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                  : cn(TEXT_MUTED, "hover:text-zinc-900 dark:hover:text-zinc-50"),
              )}
            >
              <Icon className={cn("size-4", isActive && "text-emerald-600 dark:text-emerald-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className={CARD_STANDARD}>
        {activeTab === "meeting" && (
          <form
            onSubmit={handleStartCapture}
            className="flex flex-col gap-4 lg:flex-row lg:items-center"
          >
            <div className="relative flex-[1.4]">
              <KeyboardIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Name your meeting"
                className="h-11 w-full rounded-xl border-zinc-200 bg-transparent pl-11 pr-4 text-sm dark:border-zinc-800"
              />
            </div>
            <InviteEmailList
              emails={inviteEmails}
              onEmailsChange={setInviteEmails}
              layout="inline"
              placeholder="Invite teammates by email (optional)"
              className="min-w-0 flex-1"
            />
            <Button
              type="submit"
              className={cn(
                BTN_PRIMARY,
                "shrink-0 gap-2 bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400",
              )}
            >
              <VideoIcon className="size-4" />
              Start capturing
            </Button>
          </form>
        )}

        {activeTab === "recording" && (
          <div className="flex flex-col items-stretch gap-4 md:flex-row">
            <Button
              onClick={() => goToRecordings("record")}
              className={cn(
                BTN_PRIMARY,
                "h-11 flex-1 gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700",
              )}
            >
              <span className="size-2 rounded-full bg-red-400" />
              Start instant recording
            </Button>

            <Button
              variant="outline"
              onClick={() => goToRecordings("upload")}
              className="flex h-11 flex-[1.5] items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-200 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              <UploadCloudIcon className={cn("size-5", TEXT_MUTED)} />
              <span className={cn("text-sm font-medium", TEXT_MUTED)}>Upload recording</span>
            </Button>
          </div>
        )}

        {activeTab === "schedule" && (
          <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <TypeIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                placeholder="Meeting title"
                className="h-11 w-full rounded-xl border-zinc-200 bg-transparent pl-11 pr-4 text-sm dark:border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="relative">
                <CalendarIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-11 w-full rounded-xl border-zinc-200 bg-transparent pl-11 text-sm dark:border-zinc-800"
                />
              </div>

              <div className="relative">
                <ClockIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-11 w-full rounded-xl border-zinc-200 bg-transparent pl-11 text-sm dark:border-zinc-800"
                />
                <span className={cn("absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-bold uppercase", TEXT_MUTED)}>
                  Start
                </span>
              </div>

              <div className="relative">
                <ClockIcon className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 w-full rounded-xl border-zinc-200 bg-transparent pl-11 text-sm dark:border-zinc-800"
                />
                <span className={cn("absolute top-1/2 right-4 -translate-y-1/2 text-[10px] font-bold uppercase", TEXT_MUTED)}>
                  End
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <InviteEmailList
                  emails={scheduleInvites}
                  onEmailsChange={setScheduleInvites}
                  layout="stacked"
                  placeholder="Invitees (comma separated emails)"
                />
              </div>
              <Button
                type="submit"
                className={cn(
                  BTN_PRIMARY,
                  "gap-2 bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400",
                )}
              >
                <CalendarDaysIcon className="size-4" />
                Schedule meeting
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
