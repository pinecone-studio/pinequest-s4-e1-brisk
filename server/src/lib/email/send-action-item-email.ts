import type { Bindings } from "../common/types";
import { buildActionItemEmailContent } from "./build-action-item-email-content";

type SendActionItemEmailInput = {
  env: Bindings;
  meetingId: string;
  meetingTitle: string;
  noteTitle: string;
  assignee: string;
  assigneeEmail: string;
  dateTimeLabel: string | null;
  source: "action" | "protocol";
};

const getSummaryUrl = (env: Bindings, meetingId: string) => {
  const baseUrl = (env.CLIENT_APP_URL ?? env.FRONTEND_URL ?? "").replace(/\/$/, "");
  return `${baseUrl}/meetings/${meetingId}`;
};

export async function sendActionItemEmail({
  env,
  meetingId,
  meetingTitle,
  noteTitle,
  assignee,
  assigneeEmail,
  dateTimeLabel,
  source,
}: SendActionItemEmailInput) {
  if (!env.EMAIL || !env.EMAIL_FROM_ADDRESS) {
    throw new Error("Email service is not configured");
  }

  const { subject, text, html } = buildActionItemEmailContent({
    meetingTitle,
    noteTitle,
    assignee,
    dateTimeLabel,
    summaryUrl: getSummaryUrl(env, meetingId),
    source,
  });

  await env.EMAIL.send({
    from: { email: env.EMAIL_FROM_ADDRESS, name: env.EMAIL_FROM_NAME ?? "Brisk" },
    to: assigneeEmail.trim().toLowerCase(),
    subject,
    text,
    html,
  });
}
