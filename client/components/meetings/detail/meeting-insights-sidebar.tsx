"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CircularProgress } from "@/components/ui/circular-progress";
import type { MeetingSentiment } from "@/lib/meetings/meeting-sentiment";
import type { SpeakerTalkTimeStat } from "@/lib/meetings/meeting-speaker-stats";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type MeetingInsightsSidebarProps = {
  sentiment: MeetingSentiment;
  speakerStats: SpeakerTalkTimeStat[];
  topics: string[];
};

const SENTIMENT_TAGS: { key: keyof MeetingSentiment; label: string; className: string }[] = [
  { key: "neutral", label: "Neutral", className: "bg-lavender text-lavender-foreground" },
  {
    key: "positive",
    label: "Positive",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  },
  {
    key: "negative",
    label: "Negative",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  },
];

export const MeetingInsightsSidebar = ({ sentiment, speakerStats, topics }: MeetingInsightsSidebarProps) => {
  const [activeFilters, setActiveFilters] = useState<Set<keyof MeetingSentiment>>(
    new Set(["neutral", "positive", "negative"]),
  );
  const { query } = useDashboardSearch();

  const filteredSpeakerStats = useMemo(() => {
    if (!query.trim()) return speakerStats;

    return speakerStats.filter((stat) =>
      matchesSearchQuery(query, stat.user.name, stat.user.role),
    );
  }, [query, speakerStats]);

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return topics;
    return topics.filter((topic) => matchesSearchQuery(query, topic));
  }, [query, topics]);

  const toggleFilter = (key: keyof MeetingSentiment) => {
    setActiveFilters((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Sentiment filters</h3>
        <div className="flex flex-wrap gap-2">
          {SENTIMENT_TAGS.map((tag) => {
            const isActive = activeFilters.has(tag.key);

            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => toggleFilter(tag.key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-foreground/5 transition-all duration-200",
                  tag.className,
                  !isActive && "opacity-40",
                )}
              >
                {tag.label} {sentiment[tag.key]}%
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Speakers</h3>
        <div className="flex flex-col gap-3">
          {filteredSpeakerStats.map((stat) => (
            <div key={stat.user.id} className="flex items-center gap-3">
              <Avatar size="sm">
                {stat.user.avatarUrl ? <AvatarImage src={stat.user.avatarUrl} alt={stat.user.name} /> : null}
                <AvatarFallback>{stat.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{stat.user.name}</span>
                {stat.user.role ? (
                  <span className="truncate text-xs text-muted-foreground">{stat.user.role}</span>
                ) : null}
              </div>
              <CircularProgress value={stat.percentage} size={36} strokeWidth={3} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Topic trackers</h3>
        <div className="flex flex-wrap gap-2">
          {filteredTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-foreground/10"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
