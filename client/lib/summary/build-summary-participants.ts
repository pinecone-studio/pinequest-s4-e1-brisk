import type { SpeakerTalkTimeStat } from "@/lib/meetings/meeting-speaker-stats";
import type { SummaryParticipant } from "@/lib/summary/summary-participant.types";
import { getEmailAvatarUrl } from "@/lib/user/email-avatar-url";

export function mapSpeakerStatsToSummaryParticipants(
  stats: SpeakerTalkTimeStat[],
): SummaryParticipant[] {
  return stats.map((stat) => ({
    id: stat.user.id,
    name: stat.user.name,
    initials: stat.user.initials,
    email: stat.user.email,
    avatarUrl: stat.user.avatarUrl ?? getEmailAvatarUrl(stat.user.email),
  }));
}
