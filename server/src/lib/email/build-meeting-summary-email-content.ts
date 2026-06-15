import type { MeetingSummaryActionItem } from "../../schema/meeting.model";
import type { ParsedMeetingSummary } from "../gemini/parse-meeting-summary";

type BuildMeetingSummaryEmailContentInput = {
  meetingTitle: string;
  summaryUrl: string;
  structuredSummary: ParsedMeetingSummary | null;
  summaryPreview: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildMeetingSummaryEmailContent({
  meetingTitle,
  summaryUrl,
  structuredSummary,
  summaryPreview,
}: BuildMeetingSummaryEmailContentInput) {
  const topics = structuredSummary?.mainTopics ?? [];
  const keyDecisions = structuredSummary?.keyDecisions ?? [];
  const actionItems = structuredSummary?.actionItems ?? [];

  const textSections = [
    `Your meeting summary for "${meetingTitle}" is ready.`,
    "",
    `View the full summary: ${summaryUrl}`,
  ];

  if (summaryPreview?.trim()) {
    textSections.push("", "Overview", summaryPreview.trim());
  }

  if (topics.length) {
    textSections.push("", "Topics", ...topics.map((topic) => `- ${topic}`));
  }

  if (keyDecisions.length) {
    textSections.push("", "Key decisions", ...keyDecisions.map((point) => `- ${point}`));
  }

  if (actionItems.length) {
    textSections.push(
      "",
      "Action items",
      ...actionItems.map((item) => `- ${item.action} (${item.owner})`),
    );
  }

  const htmlSections = [
    `<p>Your meeting summary for <strong>${escapeHtml(meetingTitle)}</strong> is ready.</p>`,
    `<p><a href="${escapeHtml(summaryUrl)}">Open meeting summary</a></p>`,
  ];

  if (summaryPreview?.trim()) {
    htmlSections.push(
      `<h2>Overview</h2><p>${escapeHtml(summaryPreview.trim()).replaceAll("\n", "<br />")}</p>`,
    );
  }

  if (topics.length) {
    htmlSections.push(
      `<h2>Topics</h2><ul>${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>`,
    );
  }

  if (keyDecisions.length) {
    htmlSections.push(
      `<h2>Key decisions</h2><ul>${keyDecisions
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join("")}</ul>`,
    );
  }

  if (actionItems.length) {
    htmlSections.push(
      `<h2>Action items</h2><ul>${actionItems
        .map(
          (item: MeetingSummaryActionItem) =>
            `<li>${escapeHtml(item.action)} <em>(${escapeHtml(item.owner)})</em></li>`,
        )
        .join("")}</ul>`,
    );
  }

  return {
    subject: `Summary ready: ${meetingTitle}`,
    text: textSections.join("\n"),
    html: htmlSections.join(""),
  };
}
