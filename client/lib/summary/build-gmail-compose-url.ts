export type GmailComposeParams = {
  to: string;
  clientName: string;
  taskDescription: string;
  websiteLink?: string;
};

export function buildGmailComposeUrl({
  to,
  clientName,
  taskDescription,
  websiteLink,
}: GmailComposeParams): string {
  const subject = "Thank you for attending our meeting! 🚀";

  const lines = [
    `Hi ${clientName},`,
    "",
    "Thank you so much for taking the time to meet with us — it was a pleasure connecting with you!",
    "Here's a quick recap of what we discussed and the next steps we've aligned on.",
    "",
    "📋 Our Task",
    `   ${taskDescription}`,
    "",
  ];

  if (websiteLink) {
    lines.push("🔗 Useful Links", `   ${websiteLink}`, "");
  }

  lines.push(
    "Please don't hesitate to reach out if you have any questions or need anything from our side.",
    "Looking forward to working together!",
    "",
    "Warm regards,",
    "The Brisk Team",
  );

  const body = lines.join("\n");

  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
