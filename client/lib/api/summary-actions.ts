import { clientApi } from "@/app/lib/client-api";
import type { SummaryNoteSource } from "@/lib/summary/summary-note.types";

export type SendActionItemEmailInput = {
  meetingId: string;
  meetingTitle: string;
  noteTitle: string;
  assignee: string;
  assigneeEmail: string;
  dateTimeLabel: string | null;
  source: SummaryNoteSource;
};

export async function sendActionItemEmail(input: SendActionItemEmailInput) {
  const { data } = await clientApi.post<{ sent: boolean; recipient: string }>(
    "/api/backend/summary/send-action-email",
    input,
  );
  return data;
}

export type GenerateNoteTitleInput = {
  meetingTitle: string;
  assignee: string;
  source: SummaryNoteSource;
  currentTitle?: string;
  topics?: string[];
};

export async function generateNoteTitle(input: GenerateNoteTitleInput) {
  const { data } = await clientApi.post<{ title: string }>(
    "/api/backend/summary/generate-note-title",
    input,
  );
  return data.title;
}
