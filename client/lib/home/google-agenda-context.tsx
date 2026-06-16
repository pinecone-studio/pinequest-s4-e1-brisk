"use client";

import {
  createGoogleCalendarEvent,
  formatGoogleWorkspaceError,
  getGoogleCalendarAgenda,
} from "@/lib/api/google-workspace";
import { isGoogleDemoShared } from "@/lib/google/demo-google";
import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import { buildStandupAgendaEvents } from "@/lib/meetings/mock-standup-story";
import {
  getLocalCalendarEventsInRange,
  saveLocalCalendarEvent,
} from "@/lib/home/local-calendar-events";
import type {
  AgendaEvent,
  CreateCalendarEventInput,
} from "@/lib/home/agenda-types";
import {
  enrichAgendaEvent,
  filterUpcomingEvents,
  getDateKey,
  getEventsForDate,
  getMonthGridBounds,
} from "@/lib/home/google-agenda-utils";
import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type GoogleAgendaContextValue = {
  events: AgendaEvent[];
  connected: boolean | null;
  isLoading: boolean;
  error: string;
  selectedDateKey: string;
  setSelectedDate: (date: Date) => void;
  reload: () => Promise<void>;
  reloadForMonth: (year: number, month: number) => Promise<void>;
  createEvent: (input: CreateCalendarEventInput) => Promise<void>;
  getEventsForDate: (date: Date) => AgendaEvent[];
};

const GoogleAgendaContext = createContext<GoogleAgendaContextValue | null>(null);

export function GoogleAgendaProvider({ children }: { children: ReactNode }) {
  useClientApiAuth();
  const { isLoaded, userId } = useAuth();

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateKey(getDateKey(date));
  }, []);

  const loadAgendaForMonth = useCallback(async (year: number, month: number) => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const bounds = getMonthGridBounds(year, month);
      const standupEvents = buildStandupAgendaEvents();
      const localEvents = getLocalCalendarEventsInRange(bounds.timeMin, bounds.timeMax);
      let response = await getGoogleCalendarAgenda(bounds);

      if (!response.connected && !isGoogleDemoShared()) {
        const { ensureGoogleWorkspaceConnection } = await import(
          "@/lib/api/google-workspace"
        );
        const connectedNow = await ensureGoogleWorkspaceConnection();
        if (connectedNow) {
          response = await getGoogleCalendarAgenda(bounds);
        }
      }

      const googleEvents = filterUpcomingEvents(
        response.events.map((event) => enrichAgendaEvent(event)),
      );

      setConnected(response.connected || standupEvents.length > 0 || localEvents.length > 0);
      setEvents([...standupEvents, ...googleEvents, ...localEvents]);
    } catch (caughtError) {
      const standupEvents = buildStandupAgendaEvents();
      const bounds = getMonthGridBounds(year, month);
      const localEvents = getLocalCalendarEventsInRange(bounds.timeMin, bounds.timeMax);
      setError(formatGoogleWorkspaceError(caughtError));
      setConnected(standupEvents.length > 0 || localEvents.length > 0);
      setEvents([...standupEvents, ...localEvents]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, userId]);

  const reloadForMonth = useCallback(
    async (year: number, month: number) => {
      setVisibleMonth({ year, month });
      await loadAgendaForMonth(year, month);
    },
    [loadAgendaForMonth],
  );

  const reload = useCallback(async () => {
    await loadAgendaForMonth(visibleMonth.year, visibleMonth.month);
  }, [loadAgendaForMonth, visibleMonth.month, visibleMonth.year]);

  const createEvent = useCallback(
    async (input: CreateCalendarEventInput) => {
      if (connected) {
        try {
          await createGoogleCalendarEvent(input);
          await loadAgendaForMonth(visibleMonth.year, visibleMonth.month);
          return;
        } catch (caughtError) {
          throw new Error(formatGoogleWorkspaceError(caughtError));
        }
      }

      saveLocalCalendarEvent(input);
      await loadAgendaForMonth(visibleMonth.year, visibleMonth.month);
    },
    [connected, loadAgendaForMonth, visibleMonth.month, visibleMonth.year],
  );

  const getEventsForDay = useCallback(
    (date: Date) => getEventsForDate(events, date),
    [events],
  );

  const value = useMemo(
    () => ({
      events,
      connected,
      isLoading,
      error,
      selectedDateKey,
      setSelectedDate,
      reload,
      reloadForMonth,
      createEvent,
      getEventsForDate: getEventsForDay,
    }),
    [
      connected,
      createEvent,
      error,
      events,
      getEventsForDay,
      isLoading,
      reload,
      reloadForMonth,
      selectedDateKey,
      setSelectedDate,
    ],
  );

  return (
    <GoogleAgendaContext.Provider value={value}>{children}</GoogleAgendaContext.Provider>
  );
}

export function useGoogleAgenda() {
  const context = useContext(GoogleAgendaContext);
  if (!context) {
    throw new Error("useGoogleAgenda must be used within GoogleAgendaProvider");
  }
  return context;
}
