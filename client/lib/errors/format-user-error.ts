export const USER_ERRORS = {
  client: "Client side error. Please try again.",
  server: "Server error. Please try again.",
  network: "Connection error. Please try again.",
  auth: "Please sign in again.",
  notFound: "Not found.",
  processingFailed: "Processing failed. Please try again.",
} as const;

const FRIENDLY_MESSAGES = new Set<string>([
  USER_ERRORS.auth,
  USER_ERRORS.client,
  USER_ERRORS.network,
  USER_ERRORS.server,
  USER_ERRORS.notFound,
  USER_ERRORS.processingFailed,
  "File is too large. Maximum size is 20MB.",
  "Microphone access was denied. Allow it in your browser to record.",
  "Could not load Google Calendar. Try again.",
  "Sign in to connect Google Workspace.",
  "Connect Google Workspace to see your upcoming meetings here.",
  "No upcoming events in the next 7 days.",
  "Delete this recording? This cannot be undone.",
  "Recording not found",
  "Transcript not found",
  "Enter a valid room code or meeting link.",
]);

const TECHNICAL_PATTERNS = [
  /failed query/i,
  /\bsql\b/i,
  /sqlite/i,
  /drizzle/i,
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
  /transcription produced/i,
  /no speech/i,
  /no text/i,
  /quota/i,
  /gemini/i,
  /chimege/i,
  /wrangler/i,
  /\bd1\b/i,
  /r2 object/i,
  /token:/i,
  /grant is missing/i,
  /expected ws:\/\//i,
  /couldn't refresh status/i,
  /internal server error/i,
  /unexpected token/i,
  /syntaxerror/i,
  /typeerror/i,
  /referenceerror/i,
  /\[object object\]/i,
  /multipart\/form-data/i,
  /unsupported audio/i,
  /exceeds the \d+mb limit/i,
];

const getMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return String(error ?? "");
};

export const isUserFriendlyMessage = (message: string) =>
  FRIENDLY_MESSAGES.has(message.trim());

const looksTechnical = (message: string) => {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > 100) return true;
  if (trimmed.includes(" at ") || trimmed.startsWith("Error:")) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
};

export const formatBackendErrorMessage = (
  message: string | null | undefined,
) => {
  if (message?.trim() && isUserFriendlyMessage(message)) {
    return message.trim();
  }

  return USER_ERRORS.processingFailed;
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
  if (looksTechnical(message)) {
    const lower = message.toLowerCase();

    if (lower.includes("unauthorized") || lower.includes("sign in")) {
      return USER_ERRORS.auth;
    }

    if (lower.includes("not found")) {
      return USER_ERRORS.notFound;
    }

    if (
      lower.includes("fetch") ||
      lower.includes("network") ||
      lower.includes("econnrefused") ||
      lower.includes("connection") ||
      lower.includes("backend is unavailable") ||
      lower.includes("timeout")
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
  }

  return USER_ERRORS.server;
};

export const formatHttpError = (status: number, rawMessage?: string) => {
  if (status === 401 || status === 403) return USER_ERRORS.auth;
  if (status === 404) return USER_ERRORS.notFound;
  if (rawMessage && isUserFriendlyMessage(rawMessage)) return rawMessage.trim();
  return formatUserError(new Error(rawMessage || `status ${status}`));
};

export const displayUserError = (error: string | null | undefined) =>
  error ? formatUserError(error) : "";
