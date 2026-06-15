import type { Bindings } from "../common/types";
import type { Attendee } from "../../schema/meeting.model";

const RESEND_API_URL = "https://api.resend.com/emails";

const getAppLink = (env: Bindings, meetingId: string) => {
  const baseUrl = (env.CLIENT_APP_URL ?? env.FRONTEND_URL ?? "").replace(/\/$/, "");
  return `${baseUrl}/meetings/${meetingId}`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const buildEmailBody = (googleDocUrl: string, appLink: string) =>
  `Thanks for attending the online meeting. Here is your Google Doc file: ${googleDocUrl}. ` +
  `You can also view more details on our app here: ${appLink}.`;

export type SendMeetingDocEmailsResult = {
  sent: string[];
  failed: { email: string; error: string }[];
};

// Loops through every attendee and sends them the Google Doc link via the
// Resend email API. Each send is independent and best-effort: one attendee's
// failure does not stop the others, and the caller decides whether the
// aggregate failure count should fail the queue job.
export async function sendMeetingDocEmails({
  env,
  attendees,
  meetingId,
  googleDocUrl,
}: {
  env: Bindings;
  attendees: Attendee[];
  meetingId: string;
  googleDocUrl: string;
}): Promise<SendMeetingDocEmailsResult> {
  const appLink = getAppLink(env, meetingId);
  const bodyText = buildEmailBody(googleDocUrl, appLink);
  const from = `${env.EMAIL_FROM_NAME ?? "Brisk"} <${env.EMAIL_FROM_ADDRESS ?? "summary@pinequest.dev"}>`;
  const apiKey = env.RESEND_API_KEY ?? "";

  const result: SendMeetingDocEmailsResult = { sent: [], failed: [] };

  for (const attendee of attendees) {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: attendee.email,
          subject: "Your meeting summary and recap are ready",
          text: bodyText,
          html: `<p>${escapeHtml(bodyText)}</p>`,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(detail || `Resend responded with ${response.status}`);
      }

      result.sent.push(attendee.email);
    } catch (error) {
      result.failed.push({ email: attendee.email, error: (error as Error).message });
    }
  }

  return result;
}
