import type { MeetingListItem } from "@/app/meeting";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentActivityFeed } from "@/components/home/recent-activity-feed";
import { WelcomeHeader } from "@/components/home/welcome-header";

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
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
        <RecentActivityFeed meetings={meetings} />
      )}
    </div>
  );
}
