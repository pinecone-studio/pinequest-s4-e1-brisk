export const PUBLIC_ERRORS = {
  client: "Client side error. Please try again.",
  server: "Server error. Please try again.",
  auth: "Please sign in again.",
  notFound: "Not found.",
  processingFailed: "Processing failed. Please try again.",
} as const;

export const toPublicApiError = (status: number) => {
  if (status === 401 || status === 403) return PUBLIC_ERRORS.auth;
  if (status === 404) return PUBLIC_ERRORS.notFound;
  if (status >= 400 && status < 500) return PUBLIC_ERRORS.client;
  return PUBLIC_ERRORS.server;
};

export const sanitizeStoredErrorMessage = (
  status: string | null | undefined,
  errorMessage: string | null | undefined,
) => {
  if (status !== "failed" || !errorMessage?.trim()) return null;
  return PUBLIC_ERRORS.processingFailed;
};

export const sanitizeRecordingForClient = <
  T extends { status: string; errorMessage: string | null | undefined },
>(
  recording: T,
) => ({
  ...recording,
  errorMessage: sanitizeStoredErrorMessage(recording.status, recording.errorMessage),
});

export const sanitizeTranscriptForClient = <
  T extends { status: string; errorMessage: string | null | undefined },
>(
  transcript: T,
) => ({
  ...transcript,
  errorMessage: sanitizeStoredErrorMessage(transcript.status, transcript.errorMessage),
});
