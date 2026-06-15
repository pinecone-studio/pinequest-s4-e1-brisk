import { eq } from "drizzle-orm";
import { meetings } from "../../schema/meeting.model";
import type { MeetingTranscriptionDb } from "../../lib/meetingTypes/meeting-transcription.types";

export const titleFromMeetingId = (meetingId: string) => {
  const words = meetingId
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.length ? words.join(" ") : "Meeting";
};

export type EnsureMeetingResult =
  | { ok: true; meeting: typeof meetings.$inferSelect; created: boolean }
  | { ok: false; reason: "forbidden" };

export const ensureMeetingForUser = async (
  db: MeetingTranscriptionDb,
  {
    meetingId,
    userId,
    title,
  }: {
    meetingId: string;
    userId: string;
    title?: string | null;
  },
): Promise<EnsureMeetingResult> => {
  const existing = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .get();

  if (existing) {
    if (existing.userId !== userId) {
      return { ok: false, reason: "forbidden" };
    }

    const normalizedTitle = title?.trim();
    if (normalizedTitle && normalizedTitle !== existing.title) {
      await db
        .update(meetings)
        .set({ title: normalizedTitle })
        .where(eq(meetings.id, meetingId));

      return {
        ok: true,
        meeting: { ...existing, title: normalizedTitle },
        created: false,
      };
    }

    return { ok: true, meeting: existing, created: false };
  }

  const meetingTitle = title?.trim() || titleFromMeetingId(meetingId);

  await db.insert(meetings).values({
    id: meetingId,
    userId,
    title: meetingTitle,
    status: "active",
  });

  const meeting = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .get();

  if (!meeting) {
    throw new Error(`Failed to create meeting ${meetingId}`);
  }

  return { ok: true, meeting, created: true };
};
