export type GoogleAgendaEvent = {
  id: string;
  title: string;
  startLabel: string;
  endLabel: string;
  startAt: string;
  endAt: string;
  organizer: string;
  isOwner: boolean;
  meetingUrl?: string;
  isNow: boolean;
  autoJoinDefault: boolean;
};

type GCalItem = {
  id: string;
  summary?: string;
  status?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  conferenceData?: {
    entryPoints?: Array<{ entryPointType: string; uri: string }>;
  };
  hangoutLink?: string;
  organizer?: { email?: string; displayName?: string; self?: boolean };
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeLabel(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return timeFormatter.format(date);
}

function normalizeEventItem(
  item: GCalItem,
  nowMs: number,
  includePast = false,
): GoogleAgendaEvent | null {
  if (item.status === "cancelled") {
    return null;
  }

  const isAllDay = Boolean(item.start.date && !item.start.dateTime);
  const startIso = isAllDay ? `${item.start.date}T00:00:00` : item.start.dateTime;
  const endIso = isAllDay ? `${item.end.date}T23:59:59` : item.end.dateTime;

  if (!startIso || !endIso) {
    return null;
  }

  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return null;
  }

  if (!includePast && endMs <= nowMs) {
    return null;
  }

  const meetEntry = item.conferenceData?.entryPoints?.find(
    (entry) => entry.entryPointType === "video",
  );
  const meetingUrl = meetEntry?.uri ?? item.hangoutLink;
  const organizer =
    item.organizer?.displayName?.trim() ||
    item.organizer?.email?.trim() ||
    "Organizer";

  return {
    id: item.id,
    title: item.summary?.trim() || "(No title)",
    startLabel: isAllDay ? "All day" : formatTimeLabel(startIso),
    endLabel: isAllDay ? "" : formatTimeLabel(endIso),
    startAt: startIso,
    endAt: endIso,
    organizer,
    isOwner: Boolean(item.organizer?.self),
    meetingUrl: meetingUrl || undefined,
    isNow: nowMs >= startMs && nowMs <= endMs,
    autoJoinDefault: Boolean(meetingUrl),
  };
}

function normalizeEvent(item: GCalItem, nowMs: number): GoogleAgendaEvent | null {
  return normalizeEventItem(item, nowMs);
}

export type CreateCalendarEventInput = {
  summary: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  attendeeEmails?: string[];
};

export async function createCalendarEvent(
  accessToken: string,
  input: CreateCalendarEventInput,
): Promise<GoogleAgendaEvent> {
  const attendees = (input.attendeeEmails ?? [])
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary.trim(),
        start: {
          dateTime: input.startDateTime,
          timeZone: input.timeZone,
        },
        end: {
          dateTime: input.endDateTime,
          timeZone: input.timeZone,
        },
        ...(attendees.length ? { attendees } : {}),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (
      response.status === 403 &&
      /insufficient authentication scopes|insufficientPermissions|Insufficient Permission/i.test(
        detail,
      )
    ) {
      throw new Error("INSUFFICIENT_GOOGLE_SCOPES");
    }

    throw new Error(
      detail
        ? `Failed to create Google Calendar event: ${detail.slice(0, 200)}`
        : "Failed to create Google Calendar event.",
    );
  }

  const item = (await response.json()) as GCalItem;
  const created = normalizeEventItem(item, Date.now(), true);

  if (!created) {
    throw new Error("Google Calendar returned an invalid event.");
  }

  return created;
}

export async function fetchCalendarAgenda(
  accessToken: string,
  bounds?: {
    timeMin: string;
    timeMax: string;
    timeZone?: string;
  },
): Promise<GoogleAgendaEvent[]> {
  const now = new Date();
  let timeMin: string;
  let timeMax: string;

  if (bounds?.timeMin && bounds?.timeMax) {
    timeMin = bounds.timeMin;
    timeMax = bounds.timeMax;
  } else {
    timeMin = now.toISOString();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    timeMax = endOfWeek.toISOString();
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  if (bounds?.timeZone) {
    params.set("timeZone", bounds.timeZone);
  }

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Failed to load Google Calendar events: ${detail.slice(0, 200)}`
        : "Failed to load Google Calendar events.",
    );
  }

  const payload = (await response.json()) as { items?: GCalItem[] };
  const nowMs = now.getTime();

  return (payload.items ?? [])
    .map((item) => normalizeEvent(item, nowMs))
    .filter((item): item is GoogleAgendaEvent => item !== null);
}

/** @deprecated Use fetchCalendarAgenda */
export const fetchTodaysAgenda = fetchCalendarAgenda;
