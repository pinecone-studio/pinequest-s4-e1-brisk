export const USER_ERRORS = {
  client: "Client side error. Please try again.",
  server: "Server error. Please try again.",
  network: "Connection error. Please try again.",
  auth: "Please sign in again.",
} as const;

const FRIENDLY_MESSAGES = new Set([
  USER_ERRORS.auth,
  USER_ERRORS.client,
  USER_ERRORS.network,
  USER_ERRORS.server,
  "File is too large. Maximum size is 20MB.",
  "Microphone access was denied. Allow it in your browser to record.",
  "Processing failed. Please try again.",
  "Processing your recording…",
  "Could not load Google Calendar. Try again.",
  "Sign in to connect Google Workspace.",
  "Connect Google Workspace to see your upcoming meetings here.",
  "No upcoming events in the next 7 days.",
  "Delete this recording? This cannot be undone.",
]);

const TECHNICAL_PATTERNS = [
  /failed query/i,
  /\bsql\b/i,
  /econnrefused/i,
  /fetch failed/i,
  /network error/i,
  /api request failed/i,
  /proxy failed/i,
  /workers\.dev/i,
  /localhost:\d+/i,
  /status \d{3}/i,
  /unauthorized/i,
  /diarized transcription/i,
  /quota/i,
  /gemini/i,
  /chimege/i,
  /wrangler/i,
  /d1/i,
  /r2 object/i,
  /token:/i,
  /grant is missing/i,
  /expected ws:\/\//i,
  /couldn't refresh status/i,
];

const getMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return String(error ?? "");
};

export const isUserFriendlyMessage = (message: string) => {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (FRIENDLY_MESSAGES.has(trimmed)) return true;
  if (trimmed.length > 120) return false;
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) return false;
  if (trimmed.includes(" at ") || trimmed.startsWith("Error:")) return false;
  return true;
};

export const formatBackendErrorMessage = (
  message: string | null | undefined,
) => {
  if (!message?.trim()) return USER_ERRORS.server;
  if (isUserFriendlyMessage(message)) return message.trim();
  return USER_ERRORS.server;
};

export const formatUserError = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Microphone access was denied. Allow it in your browser to record.";
    }

    return USER_ERRORS.client;
  }

  const message = getMessage(error).trim();
  if (!message) return USER_ERRORS.client;
  if (isUserFriendlyMessage(message)) return message;

  const lower = message.toLowerCase();

  if (lower.includes("unauthorized") || lower.includes("sign in")) {
    return USER_ERRORS.auth;
  }

  if (
    lower.includes("fetch") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("connection") ||
    lower.includes("backend is unavailable")
  ) {
    return USER_ERRORS.network;
  }

  if (
    lower.includes("livekit") ||
    lower.includes("invalid livekit") ||
    lower.includes("roomjoin")
  ) {
    return USER_ERRORS.client;
  }

  return USER_ERRORS.server;
};

export const formatHttpError = (status: number, rawMessage?: string) =>
  formatUserError(new Error(rawMessage || `status ${status}`));
