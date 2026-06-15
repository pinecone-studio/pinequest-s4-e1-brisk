import { describe, expect, test, mock } from "bun:test";
import type { Context } from "hono";
import type { Bindings } from "../../lib/common/types";
import { meetings, meetingTranscriptSegments } from "../../schema/meeting.model";

let meetingRow: Record<string, unknown> | undefined;
let insertedValues: Record<string, unknown>[] = [];

mock.module("../../lib/db/db", () => ({
  useDB: () => ({
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          get: async () => (table === meetings ? meetingRow : undefined),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: async (values: Record<string, unknown>) => {
        if (table === meetingTranscriptSegments) {
          insertedValues.push(values);
        }
      },
    }),
  }),
}));

const { postStreamTranscript } = await import("./post-stream-transcript");

type JsonCall = { body: unknown; status?: number };

const createContext = (meetingId: string | undefined, body: unknown) => {
  const calls: JsonCall[] = [];
  const c = {
    req: {
      param: () => meetingId,
      json: async () => body,
    },
    json: (b: unknown, status?: number) => {
      calls.push({ body: b, status });
      return { body: b, status };
    },
  } as unknown as Context<{ Bindings: Bindings }>;

  return { c, calls };
};

describe("postStreamTranscript", () => {
  test("returns 400 when the meeting id param is missing", async () => {
    const { c, calls } = createContext("", { speaker: "Alice", text: "hello" });

    await postStreamTranscript(c);

    expect(calls[0]).toEqual({ body: { error: "id is required" }, status: 400 });
  });

  test("returns 400 when speaker is missing", async () => {
    meetingRow = { id: "meeting-1" };
    const { c, calls } = createContext("meeting-1", { text: "hello" });

    await postStreamTranscript(c);

    expect(calls[0]).toEqual({ body: { error: "speaker is required" }, status: 400 });
  });

  test("returns 400 when text is missing", async () => {
    meetingRow = { id: "meeting-1" };
    const { c, calls } = createContext("meeting-1", { speaker: "Alice" });

    await postStreamTranscript(c);

    expect(calls[0]).toEqual({ body: { error: "text is required" }, status: 400 });
  });

  test("returns 404 when the meeting does not exist", async () => {
    meetingRow = undefined;
    const { c, calls } = createContext("missing-meeting", { speaker: "Alice", text: "hello" });

    await postStreamTranscript(c);

    expect(calls[0]).toEqual({ body: { error: "Not found." }, status: 404 });
  });

  test("inserts the transcript segment immediately and returns 201", async () => {
    meetingRow = { id: "meeting-1" };
    insertedValues = [];
    const { c, calls } = createContext("meeting-1", { speaker: "Alice", text: "Hello team" });

    await postStreamTranscript(c);

    expect(calls[0]?.status).toBe(201);
    const body = calls[0]?.body as { id: string; timestamp: Date };
    expect(typeof body.id).toBe("string");
    expect(body.timestamp).toBeInstanceOf(Date);

    expect(insertedValues).toEqual([
      {
        id: body.id,
        meetingId: "meeting-1",
        speakerName: "Alice",
        text: "Hello team",
        timestamp: body.timestamp,
      },
    ]);
  });
});
