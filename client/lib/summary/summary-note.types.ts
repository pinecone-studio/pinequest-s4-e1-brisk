export type SummaryNoteSource = "action" | "protocol";

export type SummaryNoteItem = {
  id: string;
  title: string;
  assignee: string;
  dateTime: string | null;
  meetingId: string;
  meetingTitle: string;
  source: SummaryNoteSource;
};
