export function formatSummaryNoteDateTime(value: string | null) {
  if (!value) return "No date set";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
