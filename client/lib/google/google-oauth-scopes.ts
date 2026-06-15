export const GOOGLE_CALENDAR_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

export const GOOGLE_WORKSPACE_OAUTH_SCOPES = [
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
] as const;

export const CLERK_GOOGLE_ADDITIONAL_SCOPES = [GOOGLE_CALENDAR_EVENTS_SCOPE] as const;

export function hasGoogleCalendarEventsScope(approvedScopes: string | undefined) {
  if (!approvedScopes) {
    return false;
  }

  return approvedScopes
    .split(/\s+/)
    .filter(Boolean)
    .includes(GOOGLE_CALENDAR_EVENTS_SCOPE);
}
