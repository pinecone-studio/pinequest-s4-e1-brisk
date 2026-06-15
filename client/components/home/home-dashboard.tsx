import type { MeetingListItem } from "@/app/meeting";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentActivityFeed } from "@/components/home/recent-activity-feed";
import { StandupStorySection } from "@/components/home/standup-story-section";
import { WelcomeHeader } from "@/components/home/welcome-header";
import { TEXT_MUTED, TEXT_PRIMARY } from "@/lib/ui/design-tokens";
import { isMockStandupMeeting } from "@/lib/meetings/mock-standup-story";
import { cn } from "@/lib/utils";

type HomeDashboardProps = {
  meetings: MeetingListItem[];
  todayLabel: string;
  searchQuery?: string;
  totalMeetings?: number;
};

export function HomeDashboard({
  meetings,
  todayLabel,
  searchQuery = "",
  totalMeetings = meetings.length,
}: HomeDashboardProps) {
  const hasSearch = Boolean(searchQuery.trim());
  const showSearchEmpty = hasSearch && meetings.length === 0 && totalMeetings > 0;

  const recentMeetings = meetings.filter((meeting) => !isMockStandupMeeting(meeting.id));

  return (
    <div className="flex flex-col gap-5">
      <WelcomeHeader todayLabel={todayLabel} />
      <QuickActions />

      {showSearchEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 py-16 text-center dark:border-zinc-800">
          <p className={cn("font-medium", TEXT_PRIMARY)}>No matching meetings</p>
          <p className={cn("text-sm", TEXT_MUTED)}>Try a different search term.</p>
        </div>
      ) : (
        <>
          <StandupStorySection />
          <RecentActivityFeed meetings={recentMeetings} />
        </>
      )}
    </div>
  );
}
