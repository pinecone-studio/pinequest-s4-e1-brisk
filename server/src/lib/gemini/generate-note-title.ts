import type { Bindings } from "../common/types";
import { generateGeminiJson, parseJsonFromGeminiText } from "./gemini-client";

type GenerateNoteTitleInput = {
  meetingTitle: string;
  assignee: string;
  source: "action" | "protocol";
  currentTitle?: string;
  topics?: string[];
};

type GenerateNoteTitleResult = {
  title: string;
};

export async function generateNoteTitle(
  bindings: Bindings,
  input: GenerateNoteTitleInput,
): Promise<string> {
  const topicsSection = input.topics?.length
    ? `Meeting topics: ${input.topics.join(", ")}\n`
    : "";

  const currentSection = input.currentTitle?.trim()
    ? `Current draft title: ${input.currentTitle.trim()}\n`
    : "";

  const raw = await generateGeminiJson(bindings, {
    systemPrompt:
      "You write concise action-item titles for a meeting productivity app. Respond in Mongolian when the meeting context is Mongolian.",
    userPrompt:
      `${topicsSection}${currentSection}` +
      `Meeting: ${input.meetingTitle}\n` +
      `Assignee: ${input.assignee}\n` +
      `Note type: ${input.source === "protocol" ? "protocol" : "action item"}\n\n` +
      'Return ONLY JSON: {"title": string}. The title should be one clear sentence, max 120 characters, suitable as a task card headline.',
  });

  const parsed = parseJsonFromGeminiText(raw) as GenerateNoteTitleResult;
  const title = parsed.title?.trim();

  if (!title) {
    throw new Error("Gemini did not return a title");
  }

  return title.slice(0, 160);
}
