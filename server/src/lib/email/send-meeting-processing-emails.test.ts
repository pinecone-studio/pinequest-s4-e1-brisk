import { describe, expect, test, mock } from "bun:test";
import type { Bindings } from "../common/types";
import type { Attendee } from "../../schema/meeting.model";
import { sendMeetingDocEmails } from "./send-meeting-processing-emails";

const baseEnv = {
  CLIENT_APP_URL: "https://brisk-client.example.com",
  EMAIL_FROM_ADDRESS: "summary@pinequest.dev",
  EMAIL_FROM_NAME: "Brisk",
  RESEND_API_KEY: "resend-key",
} as Bindings;

const makeAttendee = (email: string, name: string): Attendee => ({
  id: `attendee-${email}`,
  meetingId: "meeting-1",
  email,
  name,
  createdAt: new Date(),
});

describe("sendMeetingDocEmails", () => {
  test("sends the exact required body to every attendee", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const originalFetch = global.fetch;

    global.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const result = await sendMeetingDocEmails({
        env: baseEnv,
        attendees: [makeAttendee("alice@example.com", "Alice"), makeAttendee("bob@example.com", "Bob")],
        meetingId: "meeting-1",
        googleDocUrl: "https://docs.google.com/document/d/doc-1/edit",
      });

      expect(result).toEqual({ sent: ["alice@example.com", "bob@example.com"], failed: [] });
      expect(calls).toHaveLength(2);
      expect(calls[0]?.url).toBe("https://api.resend.com/emails");

      const firstBody = JSON.parse(calls[0]!.init.body as string);
      expect(firstBody.to).toBe("alice@example.com");
      expect(firstBody.from).toBe("Brisk <summary@pinequest.dev>");
      expect(firstBody.text).toBe(
        "Thanks for attending the online meeting. Here is your Google Doc file: " +
          "https://docs.google.com/document/d/doc-1/edit. You can also view more details on our app here: " +
          "https://brisk-client.example.com/meetings/meeting-1.",
      );
      expect(calls[0]?.init.headers).toMatchObject({ Authorization: "Bearer resend-key" });
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("records per-attendee failures without throwing", async () => {
    const originalFetch = global.fetch;
    let callCount = 0;

    global.fetch = mock(async () => {
      callCount += 1;
      if (callCount === 1) return new Response(JSON.stringify({ id: "email-1" }), { status: 200 });
      return new Response("Resend error", { status: 500 });
    }) as unknown as typeof fetch;

    try {
      const result = await sendMeetingDocEmails({
        env: baseEnv,
        attendees: [
          makeAttendee("alice@example.com", "Alice"),
          makeAttendee("broken@example.com", "Broken"),
        ],
        meetingId: "meeting-1",
        googleDocUrl: "https://docs.google.com/document/d/doc-1/edit",
      });

      expect(result.sent).toEqual(["alice@example.com"]);
      expect(result.failed).toEqual([{ email: "broken@example.com", error: "Resend error" }]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
