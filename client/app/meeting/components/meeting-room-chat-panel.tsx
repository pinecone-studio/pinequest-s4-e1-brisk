"use client";

import { useUser } from "@clerk/nextjs";
import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type Room,
} from "livekit-client";
import { Mic, MicOff, Send, Smile } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAT_PANEL, TEXT_MUTED, TEXT_PRIMARY } from "@/lib/ui/design-tokens";
import { cn } from "@/lib/utils";
import type { MeetingSessionParticipant } from "./meeting-session-provider";
import { getParticipantDisplayName } from "./participant-tile";

const CHAT_TOPIC = "meeting-chat";
const MAX_MESSAGE_LENGTH = 2000;

type MeetingChatPayload = {
  id: string;
  senderAvatarUrl?: string;
  senderIdentity: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: "meeting-chat-message";
};

type MeetingChatMessage = MeetingChatPayload & {
  isLocal: boolean;
};

type MeetingRoomChatPanelProps = {
  connectionState: ConnectionState;
  participants: MeetingSessionParticipant[];
  room: Room | null;
};

type ChatTab = "room" | "participants";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const formatMessageTime = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const parseChatPayload = (payload: Uint8Array): MeetingChatPayload | null => {
  try {
    const parsed = JSON.parse(textDecoder.decode(payload)) as Partial<MeetingChatPayload>;

    if (
      parsed.type !== "meeting-chat-message" ||
      typeof parsed.id !== "string" ||
      typeof parsed.senderIdentity !== "string" ||
      typeof parsed.senderName !== "string" ||
      typeof parsed.text !== "string" ||
      typeof parsed.timestamp !== "number" ||
      !parsed.id ||
      !parsed.senderIdentity ||
      !parsed.senderName ||
      !parsed.text.trim()
    ) {
      return null;
    }

    return {
      id: parsed.id,
      senderAvatarUrl:
        typeof parsed.senderAvatarUrl === "string"
          ? parsed.senderAvatarUrl
          : undefined,
      senderIdentity: parsed.senderIdentity,
      senderName: parsed.senderName,
      text: parsed.text.slice(0, MAX_MESSAGE_LENGTH),
      timestamp: parsed.timestamp,
      type: "meeting-chat-message",
    };
  } catch {
    return null;
  }
};

export const MeetingRoomChatPanel = ({
  connectionState,
  participants,
  room,
}: MeetingRoomChatPanelProps) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<ChatTab>("room");
  const [messages, setMessages] = useState<MeetingChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isConnected = connectionState === ConnectionState.Connected;
  const localParticipant = room?.localParticipant ?? null;
  const localMeetingParticipant = participants.find((participant) => participant.isLocal);
  const participantByIdentity = useMemo(
    () => new Map(participants.map((participant) => [participant.identity, participant])),
    [participants],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: Participant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== CHAT_TOPIC) return;

      const parsed = parseChatPayload(payload);
      if (!parsed || parsed.senderIdentity === room.localParticipant.identity) return;

      const participantDisplayName = participant
        ? getParticipantDisplayName(participant, parsed.senderName)
        : parsed.senderName;
      const knownParticipant = participantByIdentity.get(parsed.senderIdentity);
      const message: MeetingChatMessage = {
        ...parsed,
        senderAvatarUrl: knownParticipant?.avatarUrl ?? parsed.senderAvatarUrl,
        senderName: participantDisplayName,
        isLocal: false,
      };

      setMessages((current) => {
        if (current.some((existing) => existing.id === message.id)) return current;
        return [...current, message];
      });
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [participantByIdentity, room]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!room || !localParticipant || !isConnected || !text) return;

    const message: MeetingChatMessage = {
      id: createMessageId(),
      senderAvatarUrl: localMeetingParticipant?.avatarUrl ?? user?.imageUrl ?? undefined,
      senderIdentity: localParticipant.identity,
      senderName: getParticipantDisplayName(localParticipant),
      text: text.slice(0, MAX_MESSAGE_LENGTH),
      timestamp: Date.now(),
      type: "meeting-chat-message",
      isLocal: true,
    };

    setSendError("");

    try {
      await localParticipant.publishData(
        textEncoder.encode(
          JSON.stringify({
            id: message.id,
            senderAvatarUrl: message.senderAvatarUrl,
            senderIdentity: message.senderIdentity,
            senderName: message.senderName,
            text: message.text,
            timestamp: message.timestamp,
            type: message.type,
          } satisfies MeetingChatPayload),
        ),
        { reliable: true, topic: CHAT_TOPIC },
      );

      setMessages((current) => [...current, message]);
      setDraft("");
    } catch {
      setSendError("Message could not be sent.");
    }
  }, [draft, isConnected, localMeetingParticipant?.avatarUrl, localParticipant, room, user?.imageUrl]);

  const resolveParticipantAvatar = (participant: MeetingSessionParticipant) => {
    if (participant.isLocal && user?.imageUrl) return user.imageUrl;
    return participant.avatarUrl;
  };

  return (
    <section className={cn(CHAT_PANEL, "flex-1")}>
      <div className="shrink-0 pb-3">
        <div className="flex rounded-full bg-zinc-100 p-1.5 dark:bg-zinc-800">
          <button
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition-all duration-200",
              activeTab === "room"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                : cn(TEXT_MUTED, "hover:text-zinc-900 dark:hover:text-zinc-50"),
            )}
            onClick={() => setActiveTab("room")}
            type="button"
          >
            Room Chat
          </button>
          <button
            className={cn(
              "flex-1 rounded-full py-1.5 text-sm font-medium transition-all duration-200",
              activeTab === "participants"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-50"
                : cn(TEXT_MUTED, "hover:text-zinc-900 dark:hover:text-zinc-50"),
            )}
            onClick={() => setActiveTab("participants")}
            type="button"
          >
            Participant
          </button>
        </div>
      </div>

      {activeTab === "room" ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
            {messages.length ? (
              messages.map((message) => (
                <div
                  className={cn("flex flex-col gap-1", message.isLocal && "items-end")}
                  key={message.id}
                >
                  <span className={cn("text-xs", TEXT_MUTED)}>
                    {message.isLocal ? "You" : message.senderName} ·{" "}
                    {formatMessageTime(message.timestamp)}
                  </span>
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.isLocal
                        ? "bg-emerald-600 text-white dark:bg-emerald-500"
                        : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200",
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              ))
            ) : (
              <div className={cn("flex h-full min-h-40 items-center justify-center text-center text-sm", TEXT_MUTED)}>
                No messages yet
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="flex shrink-0 flex-col gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            {sendError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
                {sendError}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                aria-label="Add emoji"
                className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                type="button"
              >
                <Smile className="size-4" />
              </button>
              <input
                className="min-w-0 flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400"
                disabled={!isConnected}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isConnected ? "Type a message" : "Connecting..."}
                value={draft}
              />
              <button
                aria-label="Send message"
                className="flex h-11 w-11 min-w-[44px] items-center justify-center rounded-xl bg-emerald-600 text-white transition-all duration-200 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                disabled={!isConnected || !draft.trim()}
                type="submit"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-2">
          {participants.map((participant) => {
            const avatarUrl = resolveParticipantAvatar(participant);
            return (
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                key={participant.identity}
              >
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  {avatarUrl ? (
                    <img
                      alt={participant.displayName}
                      className="size-full rounded-full object-cover"
                      src={avatarUrl}
                    />
                  ) : (
                    <span className={cn("text-sm font-semibold", TEXT_MUTED)}>
                      {participant.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", TEXT_PRIMARY)}>
                  {participant.isLocal ? "You" : participant.displayName}
                </span>
                {participant.isMicrophoneEnabled ? (
                  <Mic className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <MicOff className={cn("size-4", TEXT_MUTED)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
