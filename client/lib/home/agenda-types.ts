export type AgendaEvent = {
  id: string;
  title: string;
  startLabel: string;
  endLabel: string;
  startAt: string;
  endAt: string;
  dateKey: string;
  organizer: string;
  isOwner: boolean;
  meetingUrl?: string;
  isNow: boolean;
  autoJoinDefault: boolean;
};

export type GoogleAgendaResponse = {
  connected: boolean;
  events: AgendaEvent[];
};

export type CreateCalendarEventInput = {
  summary: string;
  startDateTime: string;
  endDateTime: string;
  timeZone: string;
  attendeeEmails?: string[];
};

export type CreateCalendarEventResponse = {
  connected: boolean;
  event: AgendaEvent;
};

export const AGENDA_DAYS_AHEAD = 7;
