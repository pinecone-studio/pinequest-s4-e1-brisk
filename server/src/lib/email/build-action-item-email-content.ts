type BuildActionItemEmailContentInput = {
  meetingTitle: string;
  noteTitle: string;
  assignee: string;
  dateTimeLabel: string | null;
  summaryUrl: string;
  source: "action" | "protocol";
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildActionItemEmailContent({
  meetingTitle,
  noteTitle,
  assignee,
  dateTimeLabel,
  summaryUrl,
  source,
}: BuildActionItemEmailContentInput) {
  const kind = source === "protocol" ? "Protocol note" : "Action item";
  const subject = `[Brisk] ${kind}: ${noteTitle}`;

  const textLines = [
    `Hi ${assignee},`,
    "",
    `You have a new ${kind.toLowerCase()} from "${meetingTitle}":`,
    "",
    noteTitle,
  ];

  if (dateTimeLabel) {
    textLines.push("", `Due / scheduled: ${dateTimeLabel}`);
  }

  textLines.push("", `View the full meeting summary: ${summaryUrl}`, "", "— Brisk");

  const html = [
    `<p>Hi ${escapeHtml(assignee)},</p>`,
    `<p>You have a new <strong>${escapeHtml(kind.toLowerCase())}</strong> from <strong>${escapeHtml(meetingTitle)}</strong>:</p>`,
    `<p>${escapeHtml(noteTitle)}</p>`,
    dateTimeLabel
      ? `<p><strong>Due / scheduled:</strong> ${escapeHtml(dateTimeLabel)}</p>`
      : "",
    `<p><a href="${escapeHtml(summaryUrl)}">Open meeting summary</a></p>`,
    `<p>— Brisk</p>`,
  ]
    .filter(Boolean)
    .join("");

  return { subject, text: textLines.join("\n"), html };
}
