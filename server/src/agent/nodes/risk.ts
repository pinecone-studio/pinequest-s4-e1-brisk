import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { SupervisorGraphState } from "../state";

const SYSTEM_PROMPT = `You are an elite risk management lead. Read the conversation history and current project context, then identify potential project blockers, scope-creep risk factors, and critical dependencies. Focus exclusively on delivery risk, scope control, and dependency exposure. Ignore concerns outside of risk such as onboarding sequencing or delivery metrics.`;

type GeminiRiskResponse = {
  projectBlockers: unknown;
  scopeCreepRisks: unknown;
  dependencies: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractUserGoals(messages: BaseMessage[]): string {
  return messages
    .filter((message) => message._getType() === "human")
    .map((message) => (typeof message.content === "string" ? message.content : ""))
    .join("\n")
    .trim();
}

function buildRiskInput(state: typeof SupervisorGraphState.State): string {
  return JSON.stringify({
    context: state.context,
    userGoals: extractUserGoals(state.messages),
    conversationSummary: state.messages
      .map((message) => ({
        role: message._getType(),
        content: typeof message.content === "string" ? message.content : "",
      }))
      .filter((entry) => entry.content.length > 0),
  });
}

function formatRiskMessage(
  projectBlockers: string[],
  scopeCreepRisks: string[],
  dependencies: string[],
): string {
  const blockerSection = projectBlockers.map((blocker) => `- ${blocker}`).join("\n");
  const scopeSection = scopeCreepRisks.map((risk) => `- ${risk}`).join("\n");
  const dependencySection = dependencies.map((dependency) => `- ${dependency}`).join("\n");
  return `Risk management report:\n\nProject blockers:\n${blockerSection}\n\nScope-creep risks:\n${scopeSection}\n\nDependencies:\n${dependencySection}`;
}

export async function riskWorkerNode(state: typeof SupervisorGraphState.State) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          projectBlockers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          scopeCreepRisks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          dependencies: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["projectBlockers", "scopeCreepRisks", "dependencies"],
      },
    },
  });

  const userContent = buildRiskInput(state);

  let messageContent: string;
  try {
    const result = await model.generateContent(userContent);
    const parsed: GeminiRiskResponse = JSON.parse(result.response.text());
    if (
      !isStringArray(parsed.projectBlockers) ||
      !isStringArray(parsed.scopeCreepRisks) ||
      !isStringArray(parsed.dependencies)
    ) {
      throw new Error("Unexpected risk response shape");
    }
    messageContent = formatRiskMessage(
      parsed.projectBlockers,
      parsed.scopeCreepRisks,
      parsed.dependencies,
    );
  } catch {
    messageContent =
      "Risk analysis failed. Defaulting to a standard risk management placeholder report.";
  }

  return {
    messages: [new AIMessage(messageContent)],
    context: { ...state.context, risksIdentified: true },
    nextElement: "supervisor",
  };
}
