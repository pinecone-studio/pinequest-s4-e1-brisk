"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { UsersIcon } from "lucide-react";

type SummaryParticipantsSectionProps = {
  participants: SummaryParticipant[];
};

export function SummaryParticipantsSection({ participants }: SummaryParticipantsSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/60">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <UsersIcon className="size-4 text-primary" />
          Participants
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4">
        {participants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">No participant data yet.</p>
          </div>
        ) : (
          participants.map((participant) => (
            <div key={participant.id} className="flex items-center gap-3">
              <Avatar size="sm">
                {participant.avatarUrl ? (
                  <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                ) : null}
                <AvatarFallback>{participant.initials}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {participant.name}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
