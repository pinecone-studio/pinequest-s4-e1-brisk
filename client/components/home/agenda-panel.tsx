"use client";

import { AgendaEventCards } from "@/components/home/agenda-event-cards";
import { displayUserError } from "@/lib/errors/format-user-error";
import { formatDayHeading, parseDateKey } from "@/lib/home/google-agenda-utils";
import { isGoogleDemoShared } from "@/lib/google/demo-google";
import { useGoogleAgenda } from "@/lib/home/use-google-agenda";
import { filterAgendaEventsBySearch } from "@/lib/search/filter-agenda-events";
import { buildAgendaSearchSuggestions } from "@/lib/search/build-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";
import { Loader2Icon } from "lucide-react";
import { useMemo } from "react";

export function AgendaPanel() {
  const {
    events,
    connected,
    isLoading,
    error,
    selectedDateKey,
    getEventsForDate,
  } = useGoogleAgenda();
  const { query } = useDashboardSearch();

  const selectedDate = useMemo(
    () => parseDateKey(selectedDateKey),
    [selectedDateKey],
  );
  const dayEvents = useMemo(
    () => getEventsForDate(selectedDate),
    [getEventsForDate, selectedDate],
  );
  const filteredDayEvents = useMemo(
    () => filterAgendaEventsBySearch(dayEvents, query),
    [dayEvents, query],
  );
  const agendaSuggestions = useMemo(
    () => buildAgendaSearchSuggestions(events),
    [events],
  );
  useRegisterSearchSuggestions("agenda", agendaSuggestions);

  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-sm font-semibold text-foreground">
        {formatDayHeading(selectedDateKey)}
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading calendar…
        </div>
      ) : error && events.length === 0 ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {displayUserError(error)}
        </div>
      ) : dayEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {connected === false
            ? isGoogleDemoShared()
              ? "Shared demo calendar is not configured yet."
              : "Your Brisk standup schedule appears here once you sign in. Connect Google to add external calendar events."
            : "No events on this day."}
        </div>
      ) : filteredDayEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No calendar events match your search.
        </div>
      ) : (
        <AgendaEventCards events={filteredDayEvents} compact />
      )}
    </div>
  );
}
