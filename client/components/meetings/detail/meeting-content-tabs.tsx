"use client";

import type { MeetingDetailsActionItem, MeetingTranscriptSegment } from "@/app/meeting";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";
import type { AppUser } from "@/types";
import { useMemo } from "react";
import { MeetingNotesPanel } from "./meeting-notes-panel";
import { MeetingTopicPanel } from "./meeting-topic-panel";
import { MeetingTranscriptFeed } from "./meeting-transcript-feed";

type MeetingContentTabsProps = {
  segments: MeetingTranscriptSegment[];
  participants: AppUser[];
  summaryText: string | null;
  keyPoints: string[];
  actionItems: MeetingDetailsActionItem[];
  topics: string[];
};

const TAB_TRIGGER_CLASS = "data-active:text-violet-700 dark:data-active:text-violet-300";

export const MeetingContentTabs = ({
  segments,
  participants,
  summaryText,
  keyPoints,
  actionItems,
  topics,
}: MeetingContentTabsProps) => {
  const { query } = useDashboardSearch();

  const filteredSegments = useMemo(() => {
    if (!query.trim()) return segments;

    return segments.filter((segment) =>
      matchesSearchQuery(query, segment.speakerName, segment.text),
    );
  }, [query, segments]);

  const filteredKeyPoints = useMemo(() => {
    if (!query.trim()) return keyPoints;
    return keyPoints.filter((point) => matchesSearchQuery(query, point));
  }, [keyPoints, query]);

  const filteredActionItems = useMemo(() => {
    if (!query.trim()) return actionItems;

    return actionItems.filter((item) =>
      matchesSearchQuery(query, item.action, item.owner),
    );
  }, [actionItems, query]);

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return topics;
    return topics.filter((topic) => matchesSearchQuery(query, topic));
  }, [query, topics]);

  const filteredSummaryText = useMemo(() => {
    if (!query.trim() || !summaryText) return summaryText;
    return matchesSearchQuery(query, summaryText) ? summaryText : null;
  }, [query, summaryText]);

  return (
    <Tabs defaultValue="transcript" className="flex flex-1 flex-col gap-4">
      <TabsList className="w-fit shrink-0">
        <TabsTab value="transcript" className={TAB_TRIGGER_CLASS}>
          Transcript
        </TabsTab>
        <TabsTab value="notes" className={TAB_TRIGGER_CLASS}>
          Notes
        </TabsTab>
        <TabsTab value="topic" className={TAB_TRIGGER_CLASS}>
          Topic
        </TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="transcript" className="flex flex-1 flex-col">
        <MeetingTranscriptFeed
          segments={filteredSegments}
          participants={participants}
          emptyMessage={
            query.trim() && segments.length > 0
              ? "No transcript lines match your search."
              : undefined
          }
        />
      </TabsPanel>

      <TabsPanel value="notes" className="flex flex-1 flex-col">
        <MeetingNotesPanel
          summaryText={filteredSummaryText}
          keyPoints={filteredKeyPoints}
          actionItems={filteredActionItems}
          emptyMessage={
            query.trim() &&
            (summaryText || keyPoints.length > 0 || actionItems.length > 0)
              ? "No notes match your search."
              : undefined
          }
        />
      </TabsPanel>

      <TabsPanel value="topic" className="flex flex-1 flex-col">
        <MeetingTopicPanel
          topics={filteredTopics}
          segments={segments}
          emptyMessage={
            query.trim() && topics.length > 0
              ? "No topics match your search."
              : undefined
          }
        />
      </TabsPanel>
    </Tabs>
  );
};
