"use client";

import { useUser } from "@clerk/nextjs";
import {
  ConnectionState,
  ParticipantEvent,
  Track,
  type Participant,
} from "livekit-client";
import { useEffect, useMemo, useState } from "react";
import { buildParticipantContacts } from "@/lib/meeting/build-participant-contacts";
import { useMediaToggleShortcuts } from "@/hooks/use-media-toggle-shortcuts";
import { APP_CANVAS, LIVE_MEETING_SHELL } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { MeetingParticipantFilmstrip } from "./meeting-participant-filmstrip";
import { MeetingRoomChatPanel } from "./meeting-room-chat-panel";
import { MeetingRoomHeader } from "./meeting-room-header";
import { useMeetingSession } from "./meeting-session-provider";
import { MeetingVideoStage } from "./meeting-video-stage";
import { getParticipantDisplayName } from "./participant-tile";
import { RecordingControls, type RecordingStatus } from "./recording-controls";

type LivekitRoomViewProps = {
  autoRecord?: boolean;
  livekitRoomName: string;
  meetingId: string;
  onLeave: () => void;
  roomName: string;
  transcriptLanguage?: TranscriptLanguage;
};

export const LivekitRoomView = ({
  autoRecord,
  livekitRoomName,
  meetingId,
  onLeave,
  roomName,
  transcriptLanguage = "en",
}: LivekitRoomViewProps) => {
  const { user } = useUser();
  const {
    activeSessionHref,
    connectionState,
    error,
    leaveActiveSession,
    localParticipant,
    participants,
    remoteParticipants,
    room,
  } = useMeetingSession();
  const isConnecting = connectionState === ConnectionState.Connecting;
  const allParticipants = useMemo(
    () => [...(localParticipant ? [localParticipant] : []), ...remoteParticipants],
    [localParticipant, remoteParticipants],
  );
  const screenShareParticipants = useMemo(
    () => allParticipants.filter((participant) => participant.isScreenShareEnabled),
    [allParticipants],
  );
  const [focusedParticipantIdentity, setFocusedParticipantIdentity] = useState<
    string | null
  >(null);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("not-started");

  const focusedParticipant =
    allParticipants.find(
      (participant) => participant.identity === focusedParticipantIdentity,
    ) ??
    remoteParticipants[0] ??
    localParticipant ??
    null;
  const stageScreenShareParticipant = screenShareParticipants[0] ?? null;
  const stageMode = stageScreenShareParticipant ? "screen" : "camera";
  const stageParticipant = stageScreenShareParticipant ?? focusedParticipant;
  const mediaSource =
    stageMode === "screen" ? Track.Source.ScreenShare : Track.Source.Camera;
  const filmstripParticipants =
    stageMode === "screen"
      ? allParticipants
      : allParticipants.filter(
          (participant) => participant.identity !== stageParticipant?.identity,
        );
  const focusedFilmstripIdentity =
    stageMode === "camera" ? stageParticipant?.identity ?? null : null;

  useEffect(() => {
    if (
      focusedParticipantIdentity &&
      !allParticipants.some(
        (participant) => participant.identity === focusedParticipantIdentity,
      )
    ) {
      setFocusedParticipantIdentity(null);
    }
  }, [allParticipants, focusedParticipantIdentity]);

  const [, setLocalVersion] = useState(0);
  const [pendingMediaToggle, setPendingMediaToggle] = useState<
    "camera" | "microphone" | "screen" | null
  >(null);

  useEffect(() => {
    if (!localParticipant) return;
    const refresh = () => setLocalVersion((v) => v + 1);
    localParticipant
      .on(ParticipantEvent.TrackMuted, refresh)
      .on(ParticipantEvent.TrackUnmuted, refresh)
      .on(ParticipantEvent.LocalTrackPublished, refresh)
      .on(ParticipantEvent.LocalTrackUnpublished, refresh);
    return () => {
      localParticipant
        .off(ParticipantEvent.TrackMuted, refresh)
        .off(ParticipantEvent.TrackUnmuted, refresh)
        .off(ParticipantEvent.LocalTrackPublished, refresh)
        .off(ParticipantEvent.LocalTrackUnpublished, refresh);
    };
  }, [localParticipant]);

  const handleLeave = async () => {
    await leaveActiveSession();
    onLeave();
  };

  const toggleMicrophone = async () => {
    if (!localParticipant || pendingMediaToggle) return;
    setPendingMediaToggle("microphone");
    try {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled,
      );
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant || pendingMediaToggle) return;
    setPendingMediaToggle("camera");
    try {
      await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  useMediaToggleShortcuts({
    onToggleCamera: () => void toggleCamera(),
    onToggleMicrophone: () => void toggleMicrophone(),
  });

  const toggleScreenShare = async () => {
    if (!room || !localParticipant || pendingMediaToggle) return;
    setPendingMediaToggle("screen");
    try {
      await room.localParticipant.setScreenShareEnabled(
        !localParticipant.isScreenShareEnabled,
      );
      setLocalVersion((v) => v + 1);
    } catch {
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const getScreenShareLabel = (participant: Participant) =>
    participant.isLocal
      ? "Your screen"
      : `${getParticipantDisplayName(participant)}'s screen`;

  const getParticipantLabel = (participant: Participant) =>
    participant.isLocal ? "You" : getParticipantDisplayName(participant);

  const stageLabel = stageParticipant
    ? stageMode === "screen"
      ? getScreenShareLabel(stageParticipant)
      : getParticipantLabel(stageParticipant)
    : "";

  const participantContacts = useMemo(
    () =>
      buildParticipantContacts({
        participants,
        remoteParticipants,
        localEmail: user?.primaryEmailAddress?.emailAddress ?? null,
        localName: user?.fullName ?? user?.firstName ?? null,
      }),
    [participants, remoteParticipants, user?.primaryEmailAddress?.emailAddress, user?.fullName, user?.firstName],
  );

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", APP_CANVAS)}>
      <section
        className={LIVE_MEETING_SHELL}
        data-transcript-language={transcriptLanguage}
      >
        <div className="shrink-0 border-b border-zinc-800 px-5 py-4 lg:px-6">
          <MeetingRoomHeader
            meetingId={meetingId}
            meetingLinkPath={activeSessionHref}
            room={room}
            roomName={roomName}
          />

          <RecordingControls
            autoStart={autoRecord}
            meetingId={meetingId}
            onStatusChange={setRecordingStatus}
            participantNames={participants.map((participant) => participant.displayName)}
            participants={participantContacts}
            roomName={livekitRoomName}
          />

          {isConnecting ? (
            <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-400">
              Connecting...
            </p>
          ) : null}
          {error ? (
            <div className="mt-3 rounded-xl border border-red-900/40 bg-red-950/40 p-3 text-sm text-red-400">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 gap-5 overflow-hidden p-5 lg:gap-6 lg:p-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
            <MeetingVideoStage
              isCameraEnabled={Boolean(localParticipant?.isCameraEnabled)}
              isMicrophoneEnabled={Boolean(localParticipant?.isMicrophoneEnabled)}
              isScreenSharing={Boolean(localParticipant?.isScreenShareEnabled)}
              mediaSource={mediaSource}
              onLeave={() => void handleLeave()}
              onToggleCamera={() => void toggleCamera()}
              onToggleMicrophone={() => void toggleMicrophone()}
              onToggleScreenShare={() => void toggleScreenShare()}
              pendingMediaToggle={pendingMediaToggle}
              recordingStatus={recordingStatus}
              stageLabel={stageLabel}
              stageParticipant={stageParticipant}
            />
            <MeetingParticipantFilmstrip
              focusedIdentity={focusedFilmstripIdentity}
              getParticipantLabel={getParticipantLabel}
              onSelectParticipant={(identity) => setFocusedParticipantIdentity(identity)}
              participants={filmstripParticipants}
            />
          </div>

          <aside className="flex h-full w-[min(100%,380px)] shrink-0 flex-col lg:w-[380px]">
            <MeetingRoomChatPanel
              connectionState={connectionState}
              participants={participants}
              room={room}
            />
          </aside>
        </div>
      </section>
    </div>
  );
};
