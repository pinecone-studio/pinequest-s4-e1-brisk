"use client";

import { slugifyRoomName } from "@/app/meeting/utils/slugify-room-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  KeyboardIcon,
  MailIcon,
  Radio,
  TypeIcon,
  UploadCloudIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

type ActionTab = "meeting" | "recording" | "schedule";

const TABS: { id: ActionTab; label: string; icon: LucideIcon }[] = [
  { id: "meeting", label: "New meeting", icon: VideoIcon },
  { id: "recording", label: "Start instant recording", icon: Radio },
  { id: "schedule", label: "Schedule meeting", icon: CalendarDaysIcon },
];

export function QuickActions() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActionTab>("meeting");

  const [meetingName, setMeetingName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleInvites, setScheduleInvites] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScheduleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.add({
      title: "Meeting Scheduled",
      description: `${scheduleTitle} set for ${scheduleDate} from ${startTime} to ${endTime}`,
      type: "success",
    });
  };

  const handleStartCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const meetingId = slugifyRoomName(meetingName) || `instant-${Date.now()}`;
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
              onClick={() => setActiveTab(tab.id)}
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
            <div className="relative flex-[1.4]">
              <KeyboardIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Name your meeting"
                className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base focus-visible:ring-primary/50"
              />
            </div>
            <div className="relative flex-1">
              <MailIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="Invite teammates by email (optional)"
                className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base focus-visible:ring-primary/50"
              />
            </div>
            <Button
              type="submit"
              className="h-13 gap-2.5 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/80"
            >
              <VideoIcon className="size-5" />
              Start new meeting
            </Button>
          </form>
        )}

        {activeTab === "recording" && (
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            <Button
              onClick={() => setIsRecording(!isRecording)}
              className={cn(
                "h-20 flex-1 rounded-2xl gap-4 text-lg font-bold transition-all duration-200",
                isRecording
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-[#1a1a1a] border border-white/[0.05] text-white hover:bg-[#252525]",
              )}
            >
              <div
                className={cn(
                  "size-3 rounded-full bg-red-500",
                  isRecording && "animate-ping",
                )}
              />
              {isRecording ? "Stop Recording" : "Start instant recording"}
            </Button>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-20 flex-[1.5] rounded-2xl border-2 border-dashed border-foreground/10 bg-muted/10 flex items-center justify-center gap-3 cursor-pointer hover:bg-muted/20 transition-all"
            >
              <input ref={fileInputRef} type="file" className="hidden" />
              <UploadCloudIcon className="size-6 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                Upload recording
              </span>
            </div>
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

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MailIcon className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80" />
                <Input
                  value={scheduleInvites}
                  onChange={(e) => setScheduleInvites(e.target.value)}
                  placeholder="Invitees (comma separated emails)"
                  className="h-13 w-full rounded-2xl bg-transparent pl-12 pr-4 text-base focus-visible:ring-primary/50"
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
