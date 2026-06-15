import { describe, expect, test, mock } from "bun:test";
import { buildMeetingDocumentRequests, createMeetingSummaryDocument } from "./google-docs.service";

describe("buildMeetingDocumentRequests", () => {
  test("structures the summary section, page break, and transcript section", () => {
    const requests = buildMeetingDocumentRequests({
      title: "Standup",
      summary: {
        topicsDiscussed: ["Roadmap planning"],
        decisionsMade: ["Ship the beta by Friday"],
      },
      segments: [
        {
          speakerName: "Alice",
          text: "Let's ship it.",
          timestamp: new Date("2026-06-15T09:00:00Z"),
        },
      ],
    });

    // "1. Meeting Summary" heading
    expect(requests[0]).toEqual({
      insertText: { location: { index: 1 }, text: "1. Meeting Summary\n" },
    });
    expect(requests[1]).toMatchObject({
      updateParagraphStyle: {
        paragraphStyle: { namedStyleType: "HEADING_1" },
        fields: "namedStyleType",
      },
    });

    // "Topics Discussed" heading + bullet list
    expect(requests[2]).toMatchObject({ insertText: { text: "Topics Discussed\n" } });
    expect(requests[3]).toMatchObject({
      updateParagraphStyle: { paragraphStyle: { namedStyleType: "HEADING_2" } },
    });
    expect(requests[4]).toMatchObject({ insertText: { text: "Roadmap planning\n" } });
    expect(requests[5]).toMatchObject({ createParagraphBullets: {} });

    // "Decisions Made" heading + bullet list
    expect(requests[6]).toMatchObject({ insertText: { text: "Decisions Made\n" } });
    expect(requests[7]).toMatchObject({
      updateParagraphStyle: { paragraphStyle: { namedStyleType: "HEADING_2" } },
    });
    expect(requests[8]).toMatchObject({ insertText: { text: "Ship the beta by Friday\n" } });
    expect(requests[9]).toMatchObject({ createParagraphBullets: {} });

    // Page break separating the summary from the full transcript
    expect(requests[10]).toMatchObject({ insertPageBreak: {} });

    // "2. Full Chronological Transcript" heading
    expect(requests[11]).toMatchObject({
      insertText: { text: "2. Full Chronological Transcript\n" },
    });
    expect(requests[12]).toMatchObject({
      updateParagraphStyle: { paragraphStyle: { namedStyleType: "HEADING_1" } },
    });

    // Transcript segment: bold "[time] Speaker: " label followed by the body text
    const label = requests[13] as { insertText: { text: string } };
    expect(label.insertText.text).toMatch(/^\[\d{2}:\d{2}:\d{2}\s[AP]M\] Alice: $/);
    expect(requests[14]).toMatchObject({
      updateTextStyle: { textStyle: { bold: true }, fields: "bold" },
    });
    expect(requests[15]).toMatchObject({ insertText: { text: "Let's ship it.\n" } });
  });

  test("falls back to placeholder paragraphs when there is nothing to summarize or transcribe", () => {
    const requests = buildMeetingDocumentRequests({
      title: "Empty meeting",
      summary: { topicsDiscussed: [], decisionsMade: [] },
      segments: [],
    });

    const insertedTexts = requests
      .filter((request): request is { insertText: { text: string } } => "insertText" in request)
      .map((request) => request.insertText.text);

    expect(insertedTexts).toContain("No topics were recorded.\n");
    expect(insertedTexts).toContain("No decisions were recorded.\n");
    expect(insertedTexts).toContain("No transcript was recorded for this meeting.\n");
  });
});

describe("createMeetingSummaryDocument", () => {
  const input = {
    title: "Standup",
    summary: { topicsDiscussed: [], decisionsMade: [] },
    segments: [],
  };

  test("creates, populates, and shares the document", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const originalFetch = global.fetch;

    global.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (String(url) === "https://docs.googleapis.com/v1/documents") {
        return new Response(JSON.stringify({ documentId: "doc-1" }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }) as unknown as typeof fetch;

    try {
      const result = await createMeetingSummaryDocument("token-123", input);

      expect(result).toEqual({
        documentId: "doc-1",
        url: "https://docs.google.com/document/d/doc-1/edit",
      });
      expect(calls).toHaveLength(3);
      expect(calls[0]?.url).toBe("https://docs.googleapis.com/v1/documents");
      expect(calls[1]?.url).toBe("https://docs.googleapis.com/v1/documents/doc-1:batchUpdate");
      expect(calls[2]?.url).toBe("https://www.googleapis.com/drive/v3/files/doc-1/permissions");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("throws INSUFFICIENT_GOOGLE_SCOPES when Google reports a scopes error", async () => {
    const originalFetch = global.fetch;

    global.fetch = mock(
      async () => new Response("Request had insufficient authentication scopes.", { status: 403 }),
    ) as unknown as typeof fetch;

    try {
      await expect(createMeetingSummaryDocument("token-123", input)).rejects.toThrow(
        "INSUFFICIENT_GOOGLE_SCOPES",
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("throws a descriptive error when document creation fails", async () => {
    const originalFetch = global.fetch;

    global.fetch = mock(async () => new Response("boom", { status: 500 })) as unknown as typeof fetch;

    try {
      await expect(createMeetingSummaryDocument("token-123", input)).rejects.toThrow(
        /Failed to create Google Doc/,
      );
    } finally {
      global.fetch = originalFetch;
    }
  });
});
