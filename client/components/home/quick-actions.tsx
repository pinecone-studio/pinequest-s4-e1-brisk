"use client";

import { InviteEmailList } from "@/components/home/invite-email-list";
import { slugifyRoomName } from "@/app/meeting/utils/slugify-room-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
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
    <div className="flex flex-col gap-5 w-full">
      <div className="flex w-full items-center gap-2 overflow-x-auto rounded-[28px] bg-muted/60 p-2.5 shadow-md border border-foreground/[0.03] scrollbar-none">
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
                "flex flex-1 min-w-[180px] md:min-w-0 shrink-0 items-center justify-center gap-3 rounded-2xl px-6 py-4 text-base font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "bg-card text-foreground shadow-lg border border-foreground/[0.05]"
                  : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5.5",
                  isActive ? "scale-110 text-primary" : "opacity-80",
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl bg-card p-5 ring-1 ring-foreground/10 shadow-sm transition-all duration-300">
        {activeTab === "meeting" && (
          <form
            onSubmit={handleStartCapture}
            className="flex flex-col gap-4 lg:flex-row lg:items-center"
          >
            <div className="relative min-w-0 flex-[1.2] lg:flex-1">
              <KeyboardIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Name your meeting"
                className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base focus-visible:ring-primary/50"
              />
            </div>

            <InviteEmailList
              emails={inviteEmails}
              onEmailsChange={setInviteEmails}
              layout="inline"
              placeholder="Invite by email (optional)"
              className="min-w-0 flex-1"
            />

            <Button
              type="submit"
              className="h-13 shrink-0 gap-2.5 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/80 lg:whitespace-nowrap"
            >
              <VideoIcon className="size-5" />
              Start new meeting
            </Button>
          </form>
        )}

        {activeTab === "recording" && (
          <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
            <Button
              onClick={() => goToRecordings("record")}
              className="h-20 flex-1 rounded-2xl gap-4 bg-[#1a1a1a] text-lg font-bold text-white hover:bg-[#252525] dark:border dark:border-white/[0.05]"
            >
              <div className="size-3 rounded-full bg-red-500" />
              Start instant recording
            </Button>

            <Button
              variant="outline"
              onClick={() => goToRecordings("upload")}
              className="h-20 flex-[1.5] rounded-2xl border-2 border-dashed border-foreground/10 bg-muted/10 text-muted-foreground hover:bg-muted/20"
            >
              <UploadCloudIcon className="size-6" />
              Upload recording
            </Button>
          </div>
        )}

        {activeTab === "schedule" && (
          <form onSubmit={handleScheduleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              <TypeIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
                placeholder="Meeting title"
                className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base focus-visible:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative col-span-1">
                <CalendarIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="h-13 w-full rounded-2xl bg-transparent pl-12 text-base focus-visible:ring-primary/50 block appearance-none"
                />
              </div>

              <div className="relative col-span-1">
                <ClockIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-13 w-full rounded-2xl bg-transparent pl-12 text-base focus-visible:ring-primary/50 block"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold">
                  Start
                </span>
              </div>

              <div className="relative col-span-1">
                <ClockIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-13 w-full rounded-2xl bg-transparent pl-12 text-base focus-visible:ring-primary/50 block"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold">
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
                className="h-13 gap-2.5 rounded-2xl bg-primary px-10 text-base font-semibold text-primary-foreground hover:bg-primary/80"
              >
                <CalendarDaysIcon className="size-5" />
                Schedule meeting
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
