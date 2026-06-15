import type { Bindings } from "../common/types";
import { generateGeminiJson } from "../gemini/gemini-client";

export type MeetingProcessingSummary = {
  topicsDiscussed: string[];
  decisionsMade: string[];
};

export type TranscriptLine = {
  speakerName: string;
  text: string;
};

const SUMMARY_PROMPT =
  "Read the following meeting transcript. " +
  "Return ONLY a JSON object (no markdown, no commentary) with this exact shape:\n" +
  '{"topicsDiscussed": string[], "decisionsMade": string[]}\n\n' +
  '"topicsDiscussed" lists the main topics covered in the meeting as short phrases. ' +
  '"decisionsMade" lists the concrete decisions or agreements reached. ' +
  'If nothing qualifies for a field, return an empty array for it.\n\n';

const toStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

const parseSummaryPayload = (raw: string): MeetingProcessingSummary | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const topicsDiscussed = toStringList(parsed.topicsDiscussed);
    const decisionsMade = toStringList(parsed.decisionsMade);

    if (!topicsDiscussed.length && !decisionsMade.length) return null;

    return { topicsDiscussed, decisionsMade };
  } catch {
    return null;
  }
};

const DECISION_KEYWORDS = [
  "decide",
  "decided",
  "decision",
  "agreed",
  "agree",
  "will",
  "let's",
  "lets",
  "action item",
  "next step",
];

// Deterministic fallback used when Gemini is unconfigured or unavailable, so
// the pipeline always produces a usable summary instead of failing the queue
// job over a missing third-party API key.
const buildFallbackSummary = (
  segments: TranscriptLine[],
): MeetingProcessingSummary => {
  const topicsDiscussed: string[] = [];
  const decisionsMade: string[] = [];
  const seenTopics = new Set<string>();

  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;

    const firstSentence = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text;
    const topic = `${segment.speakerName}: ${firstSentence}`.slice(0, 160);

    if (!seenTopics.has(topic) && topicsDiscussed.length < 5) {
      seenTopics.add(topic);
      topicsDiscussed.push(topic);
    }

    const lowerText = text.toLowerCase();
    if (
      decisionsMade.length < 5 &&
      DECISION_KEYWORDS.some((keyword) => lowerText.includes(keyword))
    ) {
      decisionsMade.push(`${segment.speakerName}: ${firstSentence}`.slice(0, 160));
    }
  }

  if (!decisionsMade.length) {
    decisionsMade.push("No explicit decisions were recorded.");
  }

  return { topicsDiscussed, decisionsMade };
};

// Generates the structured summary payload used to populate the "Meeting
// Summary" section of the Google Doc. Uses Gemini when configured, falling
// back to a deterministic heuristic so the background job never fails purely
// because the AI summary step is unavailable.
export async function generateMeetingProcessingSummary(
  env: Bindings,
  segments: TranscriptLine[],
): Promise<MeetingProcessingSummary> {
  const fallback = buildFallbackSummary(segments);

  if (!segments.length || !env.GEMINI_API_KEY?.trim()) {
    return fallback;
  }

  const transcript = segments
    .map((segment) => `${segment.speakerName}: ${segment.text}`)
    .join("\n");

  try {
    const raw = await generateGeminiJson(env, {
      userPrompt: `${SUMMARY_PROMPT}Transcript:\n${transcript}`,
    });

    return parseSummaryPayload(raw) ?? fallback;
  } catch (error) {
    console.warn("[meetingProcessing] Falling back to heuristic summary", {
      error: (error as Error).message,
    });
    return fallback;
  }
}
