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
    <div className="flex h-[120px] min-h-[120px] w-full shrink-0 items-center gap-4 overflow-x-auto scroll-smooth pb-1 scrollbar-none">
      {participants.map((participant) => (
        <ParticipantTile
          className="relative h-full min-h-0 w-[180px] min-w-[180px] shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
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
