import type { SummaryNoteItem } from "@/lib/summary/summary-note.types";

function topicTokens(topic: string) {
  return topic
    .toLowerCase()
    .split(/[\s,.:|—–\-/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 || /\d/.test(token));
}

export function noteMatchesTopic(note: SummaryNoteItem, topic: string) {
  const normalizedTopic = topic.trim().toLowerCase();
  if (!normalizedTopic) return true;

  const haystack = `${note.title} ${note.meetingTitle}`.toLowerCase();
  if (haystack.includes(normalizedTopic)) return true;

  const tokens = topicTokens(normalizedTopic);
  return tokens.some((token) => haystack.includes(token));
}
