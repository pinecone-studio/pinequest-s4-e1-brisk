import type { MeetingProcessingSummary } from "../meetingSummary/generate-meeting-processing-summary";

export type TranscriptDocSegment = {
  speakerName: string;
  text: string;
  timestamp: Date;
};

export type CreateMeetingDocumentInput = {
  title: string;
  summary: MeetingProcessingSummary;
  segments: TranscriptDocSegment[];
};

export type CreatedMeetingDocument = {
  documentId: string;
  url: string;
};

const DOCS_API_BASE = "https://docs.googleapis.com/v1/documents";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3/files";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type DocRequest = Record<string, unknown>;
type HeadingLevel = "HEADING_1" | "HEADING_2";

// Builds the batchUpdate requests that fill in a freshly created (empty)
// Google Doc. Every request only ever inserts at, or styles a range ending
// at, the current write cursor — so earlier ranges are never shifted by a
// later insertion and the whole document can be built in a single forward
// pass plus one batchUpdate call.
class DocumentBuilder {
  private requests: DocRequest[] = [];
  // Document bodies start at index 1 (index 0 is reserved).
  private cursor = 1;

  private insertText(text: string) {
    if (!text) return;
    this.requests.push({
      insertText: { location: { index: this.cursor }, text },
    });
    this.cursor += text.length;
  }

  private styleParagraph(start: number, end: number, namedStyleType: HeadingLevel) {
    this.requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: end },
        paragraphStyle: { namedStyleType },
        fields: "namedStyleType",
      },
    });
  }

  private styleBold(start: number, end: number) {
    this.requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: end },
        textStyle: { bold: true },
        fields: "bold",
      },
    });
  }

  private bulletList(start: number, end: number) {
    this.requests.push({
      createParagraphBullets: {
        range: { startIndex: start, endIndex: end },
        bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
      },
    });
  }

  heading(text: string, level: HeadingLevel) {
    const start = this.cursor;
    this.insertText(`${text}\n`);
    this.styleParagraph(start, this.cursor, level);
  }

  paragraph(text: string) {
    this.insertText(`${text}\n`);
  }

  // A single paragraph with a bold prefix (e.g. "Speaker: ") followed by
  // normal-weight body text. Used for transcript lines.
  boldLeadParagraph(boldPrefix: string, rest: string) {
    const start = this.cursor;
    this.insertText(boldPrefix);
    this.styleBold(start, this.cursor);
    this.insertText(`${rest}\n`);
  }

  bulletedList(items: string[]) {
    if (!items.length) return;
    const start = this.cursor;
    for (const item of items) {
      this.insertText(`${item}\n`);
    }
    this.bulletList(start, this.cursor);
  }

  pageBreak() {
    this.requests.push({ insertPageBreak: { location: { index: this.cursor } } });
    this.cursor += 1;
  }

  build(): DocRequest[] {
    return this.requests;
  }
}

// Structures the document as two distinct sections (Google Docs has no
// concept of "tabs"): a "1. Meeting Summary" section with Heading 1/2
// styling and bullet lists, a page break, then a "2. Full Chronological
// Transcript" section with one bold-speaker paragraph per segment.
export function buildMeetingDocumentRequests(
  input: CreateMeetingDocumentInput,
): DocRequest[] {
  const builder = new DocumentBuilder();

  builder.heading("1. Meeting Summary", "HEADING_1");

  builder.heading("Topics Discussed", "HEADING_2");
  if (input.summary.topicsDiscussed.length) {
    builder.bulletedList(input.summary.topicsDiscussed);
  } else {
    builder.paragraph("No topics were recorded.");
  }

  builder.heading("Decisions Made", "HEADING_2");
  if (input.summary.decisionsMade.length) {
    builder.bulletedList(input.summary.decisionsMade);
  } else {
    builder.paragraph("No decisions were recorded.");
  }

  builder.pageBreak();

  builder.heading("2. Full Chronological Transcript", "HEADING_1");

  if (input.segments.length) {
    for (const segment of input.segments) {
      const label = `[${timeFormatter.format(segment.timestamp)}] ${segment.speakerName}: `;
      builder.boldLeadParagraph(label, segment.text);
    }
  } else {
    builder.paragraph("No transcript was recorded for this meeting.");
  }

  return builder.build();
}

async function readErrorDetail(response: Response): Promise<string> {
  return response.text().catch(() => "");
}

const isInsufficientScopeError = (status: number, detail: string) =>
  status === 403 &&
  /insufficient authentication scopes|insufficientPermissions|Insufficient Permission/i.test(
    detail,
  );

// Best-effort: lets attendees open the doc from their email without needing
// edit access to the owner's Drive. Failure here must not fail the whole
// pipeline — the document itself was already created successfully.
async function shareDocumentWithLink(accessToken: string, documentId: string) {
  try {
    const response = await fetch(`${DRIVE_API_BASE}/${documentId}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[googleDocs] Link-sharing permission request failed", {
        documentId,
        status: response.status,
      });
    }
  } catch (error) {
    console.warn("[googleDocs] Failed to set link sharing permission", {
      documentId,
      error: (error as Error).message,
    });
  }
}

// Authenticates with the Google Docs API (via the caller-supplied OAuth
// access token), creates a new Document, and structures it with the meeting
// summary and full transcript. Requires the `documents` and `drive.file`
// (or `drive`) OAuth scopes.
export async function createMeetingSummaryDocument(
  accessToken: string,
  input: CreateMeetingDocumentInput,
): Promise<CreatedMeetingDocument> {
  const createResponse = await fetch(DOCS_API_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: `${input.title} - Meeting Notes` }),
    cache: "no-store",
  });

  if (!createResponse.ok) {
    const detail = await readErrorDetail(createResponse);

    if (isInsufficientScopeError(createResponse.status, detail)) {
      throw new Error("INSUFFICIENT_GOOGLE_SCOPES");
    }

    throw new Error(
      detail
        ? `Failed to create Google Doc: ${detail.slice(0, 200)}`
        : "Failed to create Google Doc.",
    );
  }

  const created = (await createResponse.json()) as { documentId?: string };
  const documentId = created.documentId;

  if (!documentId) {
    throw new Error("Google Docs did not return a document ID.");
  }

  const requests = buildMeetingDocumentRequests(input);

  if (requests.length) {
    const updateResponse = await fetch(`${DOCS_API_BASE}/${documentId}:batchUpdate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
      cache: "no-store",
    });

    if (!updateResponse.ok) {
      const detail = await readErrorDetail(updateResponse);
      throw new Error(
        detail
          ? `Failed to populate Google Doc: ${detail.slice(0, 200)}`
          : "Failed to populate Google Doc.",
      );
    }
  }

  await shareDocumentWithLink(accessToken, documentId);

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}
