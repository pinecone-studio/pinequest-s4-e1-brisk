"use client";

import type { Participant } from "livekit-client";
import { ParticipantTile } from "./participant-tile";

type MeetingParticipantFilmstripProps = {
  focusedIdentity: string | null;
  getParticipantLabel: (participant: Participant) => string;
  onSelectParticipant: (identity: string) => void;
  participants: Participant[];
};

export const MeetingParticipantFilmstrip = ({
  focusedIdentity,
  getParticipantLabel,
  onSelectParticipant,
  participants,
}: MeetingParticipantFilmstripProps) => {
  if (!participants.length) return null;

  return (
    <div className="w-full h-[120px] min-h-[120px] flex items-center gap-4 overflow-x-auto pt-2 pb-1 scroll-smooth scrollbar-none">
      {participants.map((participant) => (
        <ParticipantTile
          className="w-[180px] min-w-[180px] h-full min-h-0 aspect-auto shrink-0 rounded-xl overflow-hidden relative bg-zinc-900 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-800"
          isFocused={focusedIdentity === participant.identity}
          key={`${participant.identity}-filmstrip`}
          label={getParticipantLabel(participant)}
          onClick={() => onSelectParticipant(participant.identity)}
          participant={participant}
          variant="compact"
        />
      ))}
    </div>
  );
};
