import { clientApi } from "@/app/lib/client-api";
import type {
  AgendaEvent,
  CreateCalendarEventInput,
  CreateCalendarEventResponse,
  GoogleAgendaResponse,
} from "@/lib/home/agenda-types";
import axios from "axios";

export async function getGoogleWorkspaceStatus() {
  const { data } = await clientApi.get<{ connected: boolean }>(
    "/api/backend/google/status",
  );
  return data;
}

export async function getGoogleCalendarAgenda(bounds?: {
  timeMin: string;
  timeMax: string;
  timeZone: string;
}) {
  const { data } = await clientApi.get<GoogleAgendaResponse>(
    "/api/backend/google/calendar/agenda",
    {
      params: bounds,
    },
  );
  return data;
}

export async function createGoogleCalendarEvent(input: CreateCalendarEventInput) {
  const { data } = await clientApi.post<CreateCalendarEventResponse>(
    "/api/backend/google/calendar/events",
    input,
  );
  return data;
}

export const GOOGLE_SCOPE_ERROR_CODE = "INSUFFICIENT_GOOGLE_SCOPES";

export function isGoogleScopeError(message: string) {
  return (
    message.includes(GOOGLE_SCOPE_ERROR_CODE) ||
    /insufficient authentication scopes|insufficientPermissions|Insufficient Permission/i.test(
      message,
    )
  );
}

export function formatGoogleWorkspaceError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { error?: string; code?: string }
      | undefined;
    const message = payload?.error;

    if (
      payload?.code === GOOGLE_SCOPE_ERROR_CODE ||
      (typeof message === "string" && isGoogleScopeError(message))
    ) {
      return "Google needs permission to create events. Reconnect Google and try again.";
    }

    if (error.response?.status === 401) {
      return "Sign in to connect Google Workspace.";
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && isGoogleScopeError(error.message)) {
    return "Google needs permission to create events. Reconnect Google and try again.";
  }

  return "Could not load Google Calendar. Try again.";
}

export async function disconnectGoogleWorkspace() {
  const { data } = await clientApi.delete<{ ok: boolean }>(
    "/api/backend/google/disconnect",
  );
  return data;
}

export async function reconnectGoogleWorkspace(returnTo = "/home") {
  await disconnectGoogleWorkspace();
  startGoogleWorkspaceConnect(returnTo);
}

export function startGoogleWorkspaceConnect(returnTo = "/home") {
  const params = new URLSearchParams({ returnTo });
  window.location.href = `/api/auth/google?${params.toString()}`;
}

export type { AgendaEvent };
