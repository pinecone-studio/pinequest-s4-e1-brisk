import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { MeetingParticipantContact } from "../../lib/meetingTypes/meeting-participant-contact.types";

export const meetingTranscriptions = sqliteTable("meeting_transcriptions", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  roomName: text("room_name").notNull(),
  audioUrl: text("audio_url"),
  egressId: text("egress_id"),
  transcript: text("transcript"),
  summary: text("summary"),
  participantNames: text("participant_names", { mode: "json" }).$type<
    string[]
  >(),
  participantEmails: text("participant_emails", { mode: "json" }).$type<
    MeetingParticipantContact[]
  >(),
  errorMessage: text("error_message"),
  status: text("status", {
    enum: ["pending", "processing", "done", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date(),
  ),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  summaryEmailsSentAt: integer("summary_emails_sent_at", { mode: "timestamp" }),
  summaryEmailsError: text("summary_emails_error"),
});

export type MeetingTranscription = typeof meetingTranscriptions.$inferSelect;
export type NewMeetingTranscription = typeof meetingTranscriptions.$inferInsert;
