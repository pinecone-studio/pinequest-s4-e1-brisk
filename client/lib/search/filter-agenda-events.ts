import type { AgendaEvent } from "@/lib/home/agenda-types";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";

export const filterAgendaEventsBySearch = (
  events: AgendaEvent[],
  query: string,
) => {
  if (!query.trim()) return events;

  return events.filter((event) =>
    matchesSearchQuery(
      query,
      event.title,
      event.organizer,
      event.startLabel,
      event.endLabel,
    ),
  );
};
