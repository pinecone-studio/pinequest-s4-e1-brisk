import type { MeetingListItem } from "@/app/meeting";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentActivityFeed } from "@/components/home/recent-activity-feed";
import { StandupStorySection } from "@/components/home/standup-story-section";
import { WelcomeHeader } from "@/components/home/welcome-header";
import { isMockStandupMeeting } from "@/lib/meetings/mock-standup-story";

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
    <div className="flex flex-col gap-6 pb-2">
      <div className="flex shrink-0 flex-col gap-6">
        <WelcomeHeader todayLabel={todayLabel} />
        <QuickActions />
      </div>

      {showSearchEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-medium text-foreground">No matching meetings</p>
          <p className="text-sm text-muted-foreground">
            Try a different search term.
          </p>
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
