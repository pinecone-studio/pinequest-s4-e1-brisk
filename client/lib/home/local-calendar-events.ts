import type { AgendaEvent, CreateCalendarEventInput } from "@/lib/home/agenda-types";
import { getDateKey } from "@/lib/home/google-agenda-utils";

const STORAGE_KEY = "brisk_local_calendar_events";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
}

export function getLocalCalendarEvents(): AgendaEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AgendaEvent[];
  } catch {
    return [];
  }
}

export function saveLocalCalendarEvent(input: CreateCalendarEventInput): AgendaEvent {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const nowMs = Date.now();
  const startMs = new Date(input.startDateTime).getTime();
  const endMs = new Date(input.endDateTime).getTime();

  const event: AgendaEvent = {
    id,
    title: input.summary,
    startLabel: formatTimeLabel(input.startDateTime),
    endLabel: formatTimeLabel(input.endDateTime),
    startAt: input.startDateTime,
    endAt: input.endDateTime,
    dateKey: getDateKey(new Date(input.startDateTime)),
    organizer: "You",
    isOwner: true,
    isNow: nowMs >= startMs && nowMs <= endMs,
    autoJoinDefault: false,
  };

  const existing = getLocalCalendarEvents();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, event]));
  } catch {
    // ignore storage errors
  }

  return event;
}

export function getLocalCalendarEventsInRange(timeMin: string, timeMax: string): AgendaEvent[] {
  const all = getLocalCalendarEvents();
  const minMs = new Date(timeMin).getTime();
  const maxMs = new Date(timeMax).getTime();
  return all.filter((event) => {
    const startMs = new Date(event.startAt).getTime();
    return startMs >= minMs && startMs <= maxMs;
  });
}
