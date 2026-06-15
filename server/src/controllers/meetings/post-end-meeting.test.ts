import { describe, expect, test, mock } from "bun:test";
import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { meetings } from "../../schema/meeting.model";

let mockUserId: string | null = "user-1";
let meetingRow:
  | {
      id: string;
      userId: string;
      title: string;
      status: string;
    }
  | undefined;
let updateCalls: Record<string, unknown>[] = [];
let insertCalls: Record<string, unknown>[] = [];

mock.module("../../lib/auth/clerk", () => ({
  getAuthenticatedUserId: async () => mockUserId,
}));

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
      values: (values: Record<string, unknown>) => {
        if (table === meetings) {
          insertCalls.push(values);
          meetingRow = values as typeof meetingRow;
        }

        return Promise.resolve();
      },
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

const createContext = (meetingId: string | undefined, body: unknown = {}) => {
  const calls: JsonCall[] = [];
  const sentJobs: unknown[] = [];
  const c = {
    req: {
      param: () => meetingId,
      json: async () => body,
    },
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
  } as unknown as Context<{ Bindings: Bindings; Variables: Variables }>;

  return { c, calls, sentJobs };
};

describe("postEndMeeting", () => {
  test("returns 401 when the user is not authenticated", async () => {
    mockUserId = null;
    const { c, calls, sentJobs } = createContext("daily-stand-up");

    await postEndMeeting(c);

    expect(calls[0]?.status).toBe(401);
    expect(sentJobs).toHaveLength(0);
  });

  test("returns 400 when the meeting id param is missing", async () => {
    mockUserId = "user-1";
    const { c, calls, sentJobs } = createContext("");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { error: "id is required" }, status: 400 });
    expect(sentJobs).toHaveLength(0);
  });

  test("creates a missing meeting, marks it completed, and enqueues processing", async () => {
    mockUserId = "user-1";
    meetingRow = undefined;
    insertCalls = [];
    updateCalls = [];
    const { c, calls, sentJobs } = createContext("daily-stand-up", {
      title: "Daily Stand Up",
    });

    await postEndMeeting(c);

    expect(insertCalls).toEqual([
      {
        id: "daily-stand-up",
        userId: "user-1",
        title: "Daily Stand Up",
        status: "active",
      },
    ]);
    expect(updateCalls).toEqual([{ status: "completed" }]);
    expect(calls[0]).toEqual({ body: { status: "completed" }, status: 200 });
    expect(sentJobs).toEqual([{ meetingId: "daily-stand-up" }]);
  });

  test("marks an active meeting completed and enqueues processing", async () => {
    mockUserId = "user-1";
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Meeting 1",
      status: "active",
    };
    updateCalls = [];
    const { c, calls, sentJobs } = createContext("meeting-1");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { status: "completed" }, status: 200 });
    expect(updateCalls).toEqual([{ status: "completed" }]);
    expect(sentJobs).toEqual([{ meetingId: "meeting-1" }]);
  });

  test("re-enqueues processing for an already-completed meeting without re-updating it", async () => {
    mockUserId = "user-1";
    meetingRow = {
      id: "meeting-1",
      userId: "user-1",
      title: "Meeting 1",
      status: "completed",
    };
    updateCalls = [];
    const { c, calls, sentJobs } = createContext("meeting-1");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { status: "completed" }, status: 200 });
    expect(updateCalls).toHaveLength(0);
    expect(sentJobs).toEqual([{ meetingId: "meeting-1" }]);
  });

  test("returns 404 when the meeting belongs to another user", async () => {
    mockUserId = "user-1";
    meetingRow = {
      id: "meeting-1",
      userId: "user-2",
      title: "Meeting 1",
      status: "active",
    };
    const { c, calls, sentJobs } = createContext("meeting-1");

    await postEndMeeting(c);

    expect(calls[0]).toEqual({ body: { error: "Not found." }, status: 404 });
    expect(sentJobs).toHaveLength(0);
  });
});
