import { describe, expect, test, mock } from "bun:test";
import type { Bindings } from "../common/types";

const geminiMock = mock(async () => '{"topicsDiscussed":[],"decisionsMade":[]}');

mock.module("../gemini/gemini-client", () => ({
  generateGeminiJson: geminiMock,
}));

const { generateMeetingProcessingSummary } = await import(
  "./generate-meeting-processing-summary"
);

const baseEnv = {} as Bindings;

describe("generateMeetingProcessingSummary", () => {
  test("falls back to a heuristic summary when Gemini is not configured", async () => {
    const segments = [
      { speakerName: "Alice", text: "Let's discuss the roadmap for Q3." },
      { speakerName: "Bob", text: "We agreed to ship the beta by Friday." },
    ];

    const summary = await generateMeetingProcessingSummary(baseEnv, segments);

    expect(summary.topicsDiscussed).toEqual([
      "Alice: Let's discuss the roadmap for Q3.",
      "Bob: We agreed to ship the beta by Friday.",
    ]);
    expect(summary.decisionsMade).toEqual([
      "Alice: Let's discuss the roadmap for Q3.",
      "Bob: We agreed to ship the beta by Friday.",
    ]);
  });

  test("falls back with a default decision message for an empty transcript", async () => {
    const summary = await generateMeetingProcessingSummary(baseEnv, []);

    expect(summary.topicsDiscussed).toEqual([]);
    expect(summary.decisionsMade).toEqual(["No explicit decisions were recorded."]);
    expect(geminiMock).not.toHaveBeenCalled();
  });

  test("uses Gemini's structured summary when configured and valid", async () => {
    geminiMock.mockClear();
    geminiMock.mockResolvedValueOnce(
      JSON.stringify({
        topicsDiscussed: ["Roadmap planning"],
        decisionsMade: ["Ship the beta by Friday"],
      }),
    );

    const env = { GEMINI_API_KEY: "test-key" } as Bindings;
    const segments = [{ speakerName: "Alice", text: "Let's discuss the roadmap." }];

    const summary = await generateMeetingProcessingSummary(env, segments);

    expect(geminiMock).toHaveBeenCalledTimes(1);
    expect(summary).toEqual({
      topicsDiscussed: ["Roadmap planning"],
      decisionsMade: ["Ship the beta by Friday"],
    });
  });

  test("falls back to the heuristic summary when Gemini returns invalid JSON", async () => {
    geminiMock.mockClear();
    geminiMock.mockResolvedValueOnce("not json");

    const env = { GEMINI_API_KEY: "test-key" } as Bindings;
    const segments = [{ speakerName: "Alice", text: "We will decide next week." }];

    const summary = await generateMeetingProcessingSummary(env, segments);

    expect(summary.decisionsMade).toEqual(["Alice: We will decide next week."]);
  });

  test("falls back to the heuristic summary when Gemini throws", async () => {
    geminiMock.mockClear();
    geminiMock.mockRejectedValueOnce(new Error("Gemini request failed"));

    const env = { GEMINI_API_KEY: "test-key" } as Bindings;
    const segments = [{ speakerName: "Alice", text: "Let's finalize the agenda." }];

    const summary = await generateMeetingProcessingSummary(env, segments);

    expect(summary.topicsDiscussed).toEqual(["Alice: Let's finalize the agenda."]);
  });
});
