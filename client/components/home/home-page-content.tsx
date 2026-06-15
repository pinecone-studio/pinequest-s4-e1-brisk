"use client";

import { fetchMeetings, type MeetingListItem } from "@/app/meeting";
import { EmptyState } from "@/components/home/empty-state";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  buildStandupStorySearchSuggestions,
  prependMockStandupMeetings,
} from "@/lib/meetings/mock-standup-story";
import { filterMeetingsBySearch } from "@/lib/search/filter-meetings";
import { buildMeetingSearchSuggestions } from "@/lib/search/build-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";

export function HomePageContent() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { query } = useDashboardSearch();

  const meetingSuggestions = useMemo(() => {
    const fromMeetings = buildMeetingSearchSuggestions(meetings);
    const fromStory = buildStandupStorySearchSuggestions().filter(
      (suggestion) => suggestion.category !== "Meeting",
    );
    return [...fromStory, ...fromMeetings];
  }, [meetings]);
  useRegisterSearchSuggestions("home-meetings", meetingSuggestions);

  const filteredMeetings = useMemo(
    () => filterMeetingsBySearch(meetings, query),
    [meetings, query],
  );

  useEffect(() => {
    let isActive = true;

    fetchMeetings()
      .then((response) => {
        if (isActive) setMeetings(prependMockStandupMeetings(response.meetings));
      })
      .catch(() => {
        if (isActive) setMeetings(prependMockStandupMeetings([]));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {isLoading ? (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 lg:px-8 lg:py-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4 lg:px-8 lg:py-6">
          <AnimatePresence mode="wait">
            {meetings.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none"
              >
                <EmptyState />
              </motion.div>
            ) : (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-none"
              >
                <HomeDashboard
                  meetings={filteredMeetings}
                  todayLabel={todayLabel}
                  searchQuery={query}
                  totalMeetings={meetings.length}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function HomePageFallback() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4 lg:px-8 lg:py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
