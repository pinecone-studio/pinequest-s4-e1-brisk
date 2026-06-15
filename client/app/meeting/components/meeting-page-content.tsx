"use client";

import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { MeetingRoomForm } from "./meeting-room-form";

type MeetingPageContentProps = {
  autoRecord?: boolean;
  selectedRoom: Pick<MeetingRoomListItem, "meetingId" | "roomName"> | null;
  transcriptLanguage?: TranscriptLanguage;
};

export const MeetingPageContent = ({
  autoRecord,
  selectedRoom,
  transcriptLanguage,
}: MeetingPageContentProps) => {
  useClientApiAuth();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <MeetingRoomForm
        autoRecord={autoRecord}
        selectedRoom={selectedRoom}
        transcriptLanguage={transcriptLanguage}
      />
    </main>
  );
};
