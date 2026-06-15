import { describe, expect, test, mock } from "bun:test";
import type { Context } from "hono";
import type { Bindings } from "../../lib/common/types";
import { meetings } from "../../schema/meeting.model";

let meetingRow: { id: string; status: string } | undefined;
let updateCalls: Record<string, unknown>[] = [];

mock.module("../../lib/db/db", () => ({
  useDB: () => ({
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          get: async () => (table === meetings ? meetingRow : undefined),
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          if (table === meetings) {
            updateCalls.push(values);
          }
        },
      }),
    }),
  }),
}));

const { postEndMeeting } = await import("./post-end-meeting");

type JsonCall = { body: unknown; status?: number };

const createContext = (meetingId: string | undefined) => {
  const calls: JsonCall[] = [];
  const sentJobs: unknown[] = [];
  const c = {
    req: { param: () => meetingId },
    env: {
      MEETING_PROCESSING_QUEUE: {
        send: async (job: unknown) => {
          sentJobs.push(job);
        },
      },
    },
    json: (b: unknown, status?: number) => {
      calls.push({ body: b, status });
      return { body: b, status };
    },
  } as unknown as Context<{ Bindings: Bindings }>;

  return { c, calls, sentJobs };
};

describe("postEndMeeting", () => {
  test("returns 400 when the meeting id param is missing", async () => {
    const { c, calls, sentJobs } = createContext("");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { error: "id is required" }, status: 400 });
    expect(sentJobs).toHaveLength(0);
  });

  test("returns 404 when the meeting does not exist", async () => {
    meetingRow = undefined;
    const { c, calls, sentJobs } = createContext("missing-meeting");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { error: "Not found." }, status: 404 });
    expect(sentJobs).toHaveLength(0);
  });

  test("marks an active meeting completed and enqueues processing", async () => {
    meetingRow = { id: "meeting-1", status: "active" };
    updateCalls = [];
    const { c, calls, sentJobs } = createContext("meeting-1");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { status: "completed" }, status: 200 });
    expect(updateCalls).toEqual([{ status: "completed" }]);
    expect(sentJobs).toEqual([{ meetingId: "meeting-1" }]);
  });

  test("re-enqueues processing for an already-completed meeting without re-updating it", async () => {
    meetingRow = { id: "meeting-1", status: "completed" };
    updateCalls = [];
    const { c, calls, sentJobs } = createContext("meeting-1");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { status: "completed" }, status: 200 });
    expect(updateCalls).toHaveLength(0);
    expect(sentJobs).toEqual([{ meetingId: "meeting-1" }]);
  });
});
