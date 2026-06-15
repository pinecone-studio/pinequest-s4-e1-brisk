import { describe, expect, test, mock } from "bun:test";
import type { Context } from "hono";
import type { Bindings } from "../../lib/common/types";
import { attendees, meetings } from "../../schema/meeting.model";

let meetingRow: Record<string, unknown> | undefined;
let upsertCalls: { values: Record<string, unknown>; conflict: unknown }[] = [];

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
      values: (values: Record<string, unknown>) => ({
        onConflictDoUpdate: async (conflict: unknown) => {
          if (table === attendees) {
            upsertCalls.push({ values, conflict });
          }
        },
      }),
    }),
  }),
}));

const { postMeetingAttendee } = await import("./post-meeting-attendee");

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

describe("postMeetingAttendee", () => {
  test("returns 400 when the meeting id param is missing", async () => {
    const { c, calls } = createContext("", { email: "a@example.com", name: "Alice" });

    await postMeetingAttendee(c);

    expect(calls[0]).toEqual({ body: { error: "id is required" }, status: 400 });
  });

  test("returns 400 when the email is invalid", async () => {
    meetingRow = { id: "meeting-1" };
    const { c, calls } = createContext("meeting-1", { email: "not-an-email", name: "Alice" });

    await postMeetingAttendee(c);

    expect(calls[0]).toEqual({ body: { error: "A valid email is required" }, status: 400 });
  });

  test("returns 400 when the name is missing", async () => {
    meetingRow = { id: "meeting-1" };
    const { c, calls } = createContext("meeting-1", { email: "alice@example.com", name: "  " });

    await postMeetingAttendee(c);

    expect(calls[0]).toEqual({ body: { error: "name is required" }, status: 400 });
  });

  test("returns 404 when the meeting does not exist", async () => {
    meetingRow = undefined;
    const { c, calls } = createContext("missing-meeting", {
      email: "alice@example.com",
      name: "Alice",
    });

    await postMeetingAttendee(c);

    expect(calls[0]).toEqual({ body: { error: "Not found." }, status: 404 });
  });

  test("upserts the attendee with a normalized email and returns 201", async () => {
    meetingRow = { id: "meeting-1" };
    upsertCalls = [];
    const { c, calls } = createContext("meeting-1", {
      email: "  Alice@Example.com  ",
      name: "  Alice  ",
    });

    await postMeetingAttendee(c);

    expect(calls[0]).toEqual({ body: { status: "ok" }, status: 201 });
    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0]?.values).toEqual({
      id: upsertCalls[0]?.values.id,
      meetingId: "meeting-1",
      email: "alice@example.com",
      name: "Alice",
    });
    expect(upsertCalls[0]?.conflict).toEqual({
      target: [attendees.meetingId, attendees.email],
      set: { name: "Alice" },
    });
  });
});
