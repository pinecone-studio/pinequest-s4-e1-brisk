import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { issueGeneratorWorkerNode } from "../src/agent/nodes/issueGenerator";

async function runTest() {
  const messyInput =
    "man we need to fix the auth screen its totally lagging when you click login double times and sometimes it breaks completely. also let's make the background blueish";

  const mockState = {
    messages: [
      new HumanMessage(
        `Turn this into a structured GitHub issue:\n${messyInput}`,
      ),
    ] as BaseMessage[],
    nextElement: "issue_worker",
    context: {
      onboardingComplete: true,
      metricsAnalyzed: true,
      risksIdentified: true,
      prGenerated: true,
      issueGenerated: false,
    },
  };

  try {
    const result = await issueGeneratorWorkerNode(mockState);
    console.log("=== ISSUE GENERATOR NODE TEST STATUS ===");
    console.log("Routing Target:", result.nextElement);
    console.log("Issue Generated Flag:", result.context?.issueGenerated);
    console.log(
      "\n=== AI GENERATED ISSUE OUTPUT ===\n",
      result.messages[result.messages.length - 1]?.content,
    );
  } catch (error) {
    console.error("Node execution failed:", error);
  }
}

runTest();
