"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AMBIENT_ORB, APP_CANVAS, LIVE_MEETING_SHELL } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./components/chat-panel";
import { ParticipantFilmstrip } from "./components/participant-filmstrip";
import { PrimaryStage } from "./components/primary-stage";
import { RoomHeader } from "./components/room-header";
import { getRoomMockData } from "./mock-data";
import type { ChatMessage, RecordingState } from "./types";

const CAPTION_INTERVAL_MS = 6000;
const ACTIVE_SPEAKER_INTERVAL_MS = 8000;

const formatTimestamp = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

type RoomViewProps = {
  initialCameraOn?: boolean;
  initialMicOn?: boolean;
  initialName?: string;
  roomId: string;
};

export const RoomView = ({
  initialCameraOn = false,
  initialMicOn = false,
  initialName,
  roomId,
}: RoomViewProps) => {
  const router = useRouter();
  const [data] = useState(() => getRoomMockData(roomId));
  const [participants, setParticipants] = useState(() => {
    const trimmedName = initialName?.trim();
    if (!trimmedName) return data.participants;

    return data.participants.map((participant) =>
      participant.isSelf
        ? { ...participant, initial: trimmedName.charAt(0).toUpperCase(), name: trimmedName }
        : participant,
    );
  });
  const [pendingParticipant, setPendingParticipant] = useState(
    data.pendingParticipant,
  );
  const [messages, setMessages] = useState<ChatMessage[]>(data.messages);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [isMicOn, setIsMicOn] = useState(initialMicOn);
  const [isCameraOn, setIsCameraOn] = useState(initialCameraOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("recording");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCaptionIndex((current) => (current + 1) % data.captions.length);
    }, CAPTION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [data.captions.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParticipants((current) => {
        if (current.length < 2) return current;
        const [active, next, ...rest] = current;
        return [next, ...rest, active];
      });
    }, ACTIVE_SPEAKER_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.isSelf ? { ...participant, isMicOn } : participant,
      ),
    );
  }, [isMicOn]);

  const handleSelectParticipant = (participantId: string) => {
    setParticipants((current) => {
      const targetIndex = current.findIndex(
        (participant) => participant.id === participantId,
      );
      if (targetIndex <= 0) return current;

      const next = [...current];
      [next[0], next[targetIndex]] = [next[targetIndex], next[0]];
      return next;
    });
  };

  const handleSendMessage = (text: string) => {
    setMessages((current) => [
      ...current,
      {
        author: "You",
        id: `msg-${Date.now()}`,
        isOwn: true,
        text,
        timestamp: formatTimestamp(new Date()),
      },
    ]);
  };

  const handleApproveParticipant = () => {
    if (!pendingParticipant) return;

    setParticipants((current) => [
      ...current,
      {
        avatarGradient: "from-rose-400 to-pink-600",
        id: pendingParticipant.id,
        initial: pendingParticipant.name.slice(0, 1).toUpperCase(),
        isMicOn: true,
        name: pendingParticipant.name,
      },
    ]);
    setPendingParticipant(null);
  };

  const handleRejectParticipant = () => {
    setPendingParticipant(null);
  };

  const handleToggleRecordingPause = () => {
    setRecordingState((current) =>
      current === "recording" ? "paused" : "recording",
    );
  };

  const handleEndCall = () => {
    router.push("/meetings");
  };

  const activeParticipant = participants[0];
  const filmstripParticipants = participants.slice(1);
  const activeCaption = data.captions[captionIndex];

  return (
    <div className={cn("relative flex h-screen w-full flex-col items-center justify-center overflow-hidden p-4 sm:p-6", APP_CANVAS)}>
      <div className={AMBIENT_ORB} aria-hidden />

      <section className={LIVE_MEETING_SHELL}>
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <RoomHeader
            locationLabel={data.locationLabel}
            onApproveParticipant={handleApproveParticipant}
            onRejectParticipant={handleRejectParticipant}
            pendingParticipant={pendingParticipant}
            roomName={data.roomName}
          />

          <PrimaryStage
            activeParticipant={activeParticipant}
            captionLine={activeCaption}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            onEndCall={handleEndCall}
            onStopRecording={() => setRecordingState("stopped")}
            onToggleCamera={() => setIsCameraOn((current) => !current)}
            onToggleMic={() => setIsMicOn((current) => !current)}
            onToggleRecordingPause={handleToggleRecordingPause}
            onToggleScreenShare={() =>
              setIsScreenSharing((current) => !current)
            }
            recordingState={recordingState}
          />
          <ParticipantFilmstrip
            onSelectParticipant={handleSelectParticipant}
            participants={filmstripParticipants}
          />
        </div>

        <aside className="flex h-full w-full flex-col lg:w-[360px] lg:min-w-[360px]">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            participants={participants}
          />
        </aside>
      </section>
    </div>
  );
};
