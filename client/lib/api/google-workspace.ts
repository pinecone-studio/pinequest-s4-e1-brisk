import { clientApi } from "@/app/lib/client-api";
import { isGoogleDemoShared } from "@/lib/google/demo-google";
import type {
  AgendaEvent,
  CreateCalendarEventInput,
  CreateCalendarEventResponse,
  GoogleAgendaResponse,
} from "@/lib/home/agenda-types";
import axios from "axios";

export type GoogleWorkspaceStatus = {
  connected: boolean;
  connectedFromPath: string | null;
};

export function getGoogleConnectReturnPath(returnTo?: string) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  if (typeof window === "undefined") {
    return "/home";
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  return nextPath.startsWith("/") ? nextPath : "/home";
}

const GOOGLE_OAUTH_REDIRECT_KEY = "google_oauth_redirect_attempted";

export function clearGoogleOAuthRedirectAttempt() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GOOGLE_OAUTH_REDIRECT_KEY);
}

export async function syncGoogleWorkspaceFromClerk() {
  if (isGoogleDemoShared()) {
    return { connected: false };
  }

  const { data } = await clientApi.post<{ connected: boolean }>(
    "/api/backend/google/sync-from-clerk",
    {
      connectedFromPath: getGoogleConnectReturnPath(),
    },
  );
  return data;
}

export function ensureGoogleWorkspaceOAuth() {
  if (isGoogleDemoShared()) {
    return false;
  }

  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(GOOGLE_OAUTH_REDIRECT_KEY) === "1") {
    return false;
  }

  sessionStorage.setItem(GOOGLE_OAUTH_REDIRECT_KEY, "1");
  startGoogleWorkspaceConnect();
  return true;
}

export async function ensureGoogleWorkspaceConnection() {
  const status = await getGoogleWorkspaceStatus();
  if (status.connected) {
    return true;
  }

  if (isGoogleDemoShared()) {
    return false;
  }

  const synced = await syncGoogleWorkspaceFromClerk();
  if (synced.connected) {
    return true;
  }

  return !ensureGoogleWorkspaceOAuth();
}

export async function getGoogleWorkspaceStatus() {
  const { data } = await clientApi.get<GoogleWorkspaceStatus>(
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
      return "Google Calendar access is missing. Sign in with Google or grant calendar access.";
    }

    if (error.response?.status === 401) {
      return "Sign in with Google to use Calendar.";
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && isGoogleScopeError(error.message)) {
    return "Google Calendar access is missing. Sign in with Google or grant calendar access.";
  }

  return "Could not load Google Calendar. Try again.";
}

export async function disconnectGoogleWorkspace() {
  const { data } = await clientApi.delete<{ ok: boolean }>(
    "/api/backend/google/disconnect",
  );
  return data;
}

export async function reconnectGoogleWorkspace(returnTo?: string) {
  await disconnectGoogleWorkspace();
  startGoogleWorkspaceConnect(returnTo);
}

export function startGoogleWorkspaceConnect(returnTo?: string) {
  const params = new URLSearchParams({
    returnTo: getGoogleConnectReturnPath(returnTo),
  });
  window.location.href = `/api/auth/google?${params.toString()}`;
}

export type { AgendaEvent };
