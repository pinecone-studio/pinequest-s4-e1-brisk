import { describe, expect, test, mock } from "bun:test";
import type { Bindings } from "../../lib/common/types";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";
import { attendees, meetings, meetingTranscriptSegments } from "../../schema/meeting.model";

let meetingRow: Record<string, unknown> | undefined;
let transcriptRows: Record<string, unknown>[] = [];
let attendeeRows: Record<string, unknown>[] = [];
let updateCalls: Record<string, unknown>[] = [];

const generateSummaryMock = mock(async () => ({
  topicsDiscussed: [] as string[],
  decisionsMade: [] as string[],
}));
const ensureAccessTokenMock = mock(async (): Promise<string | null> => "access-token");
const createDocMock = mock(async () => ({
  documentId: "doc-1",
  url: "https://docs.google.com/document/d/doc-1/edit",
}));
const sendEmailsMock = mock(async () => ({ sent: [] as string[], failed: [] as { email: string; error: string }[] }));

mock.module("../../lib/meetingSummary/generate-meeting-processing-summary", () => ({
  generateMeetingProcessingSummary: generateSummaryMock,
}));

mock.module("../../lib/google/google-token.service", () => ({
  ensureGoogleAccessToken: ensureAccessTokenMock,
}));

mock.module("../../lib/google/google-docs.service", () => ({
  createMeetingSummaryDocument: createDocMock,
}));

mock.module("../../lib/email/send-meeting-processing-emails", () => ({
  sendMeetingDocEmails: sendEmailsMock,
}));

const { processMeetingForCompletion } = await import("./meeting-processing.service");

const createFakeDb = (): MeetingTranscriptionDb =>
  ({
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          if (table === meetings) {
            return { get: async () => meetingRow };
          }
          if (table === meetingTranscriptSegments) {
            return { orderBy: () => ({ all: async () => transcriptRows }) };
          }
          if (table === attendees) {
            return { all: async () => attendeeRows };
          }
          return {
            get: async () => undefined,
            all: async () => [],
            orderBy: () => ({ all: async () => [] }),
          };
        },
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          updateCalls.push(values);
        },
      }),
    }),
  }) as unknown as MeetingTranscriptionDb;

const env = {} as Bindings;

const resetMocks = () => {
  generateSummaryMock.mockClear();
  ensureAccessTokenMock.mockClear();
  createDocMock.mockClear();
  sendEmailsMock.mockClear();
  updateCalls = [];
};

describe("processMeetingForCompletion", () => {
  test("throws when the meeting does not exist", async () => {
    meetingRow = undefined;
    resetMocks();
    const db = createFakeDb();

    await expect(
      processMeetingForCompletion({ db, env, meetingId: "missing" }),
    ).rejects.toThrow("Meeting not found: missing");
  });

  test("generates a Google Doc, persists it, and emails attendees when none exists yet", async () => {
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Standup",
      googleDocUrl: null,
    };
    transcriptRows = [
      { speakerName: "Alice", text: "Let's ship it", timestamp: new Date() },
    ];
    attendeeRows = [
      { id: "a1", meetingId: "meeting-1", email: "bob@example.com", name: "Bob" },
    ];
    resetMocks();
    sendEmailsMock.mockResolvedValueOnce({ sent: ["bob@example.com"], failed: [] });

    const db = createFakeDb();

    const result = await processMeetingForCompletion({ db, env, meetingId: "meeting-1" });

    expect(generateSummaryMock).toHaveBeenCalledTimes(1);
    expect(ensureAccessTokenMock).toHaveBeenCalledWith(db, "user-1", env);
    expect(createDocMock).toHaveBeenCalledTimes(1);
    expect(updateCalls).toEqual([
      { googleDocUrl: "https://docs.google.com/document/d/doc-1/edit" },
    ]);
    expect(sendEmailsMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      googleDocUrl: "https://docs.google.com/document/d/doc-1/edit",
      emailsSent: 1,
      emailsFailed: 0,
    });
  });

  test("reuses an existing Google Doc without regenerating it", async () => {
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Standup",
      googleDocUrl: "https://docs.google.com/document/d/existing/edit",
    };
    transcriptRows = [];
    attendeeRows = [
      { id: "a1", meetingId: "meeting-1", email: "bob@example.com", name: "Bob" },
    ];
    resetMocks();
    sendEmailsMock.mockResolvedValueOnce({ sent: ["bob@example.com"], failed: [] });

    const db = createFakeDb();

    const result = await processMeetingForCompletion({ db, env, meetingId: "meeting-1" });

    expect(generateSummaryMock).not.toHaveBeenCalled();
    expect(ensureAccessTokenMock).not.toHaveBeenCalled();
    expect(createDocMock).not.toHaveBeenCalled();
    expect(updateCalls).toHaveLength(0);
    expect(result.googleDocUrl).toBe("https://docs.google.com/document/d/existing/edit");
  });

  test("throws when no Google access token is available", async () => {
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Standup",
      googleDocUrl: null,
    };
    transcriptRows = [];
    attendeeRows = [];
    resetMocks();
    ensureAccessTokenMock.mockResolvedValueOnce(null);

    const db = createFakeDb();

    await expect(
      processMeetingForCompletion({ db, env, meetingId: "meeting-1" }),
    ).rejects.toThrow("No Google access token available for meeting owner user-1");

    expect(createDocMock).not.toHaveBeenCalled();
  });

  test("skips emailing and returns zero counts when there are no attendees", async () => {
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Standup",
      googleDocUrl: "https://docs.google.com/document/d/existing/edit",
    };
    transcriptRows = [];
    attendeeRows = [];
    resetMocks();

    const db = createFakeDb();

    const result = await processMeetingForCompletion({ db, env, meetingId: "meeting-1" });

    expect(sendEmailsMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      googleDocUrl: "https://docs.google.com/document/d/existing/edit",
      emailsSent: 0,
      emailsFailed: 0,
    });
  });

  test("reports failed emails without throwing", async () => {
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Standup",
      googleDocUrl: "https://docs.google.com/document/d/existing/edit",
    };
    transcriptRows = [];
    attendeeRows = [
      { id: "a1", meetingId: "meeting-1", email: "bob@example.com", name: "Bob" },
      { id: "a2", meetingId: "meeting-1", email: "broken@example.com", name: "Broken" },
    ];
    resetMocks();
    sendEmailsMock.mockResolvedValueOnce({
      sent: ["bob@example.com"],
      failed: [{ email: "broken@example.com", error: "Resend responded with 500" }],
    });

    const db = createFakeDb();

    const result = await processMeetingForCompletion({ db, env, meetingId: "meeting-1" });

    expect(result).toEqual({
      googleDocUrl: "https://docs.google.com/document/d/existing/edit",
      emailsSent: 1,
      emailsFailed: 1,
    });
  });
});
