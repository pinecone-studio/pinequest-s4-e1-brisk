"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CheckIcon, PencilIcon, TagsIcon, XIcon } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

type SummaryTopicTrackerSectionProps = {
  topics: string[];
  onTopicsChange: (topics: string[]) => void;
  activeTopic?: string | null;
  onTopicSelect?: (topic: string | null) => void;
};

export function SummaryTopicTrackerSection({
  topics,
  onTopicsChange,
  activeTopic = null,
  onTopicSelect,
}: SummaryTopicTrackerSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const handleAddTopic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = newTopic.trim();
    if (!trimmed || topics.includes(trimmed)) {
      setNewTopic("");
      return;
    }

    onTopicsChange([...topics, trimmed]);
    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    onTopicsChange(topics.filter((item) => item !== topic));
    if (activeTopic === topic) {
      onTopicSelect?.(null);
    }
  };

  const handleTopicClick = (topic: string) => {
    if (isEditing || !onTopicSelect) return;
    onTopicSelect(activeTopic === topic ? null : topic);
  };

  const handleTopicKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const trimmed = event.currentTarget.value.trim();
    if (!trimmed) return;

    const nextTopics = [...topics];
    nextTopics[index] = trimmed;
    onTopicsChange(nextTopics);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border/60 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TagsIcon className="size-4 text-primary" />
            Topic tracker
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 shrink-0 rounded-full text-muted-foreground"
            onClick={() => setIsEditing((current) => !current)}
            aria-label={isEditing ? "Done editing topics" : "Edit topics"}
          >
            {isEditing ? <CheckIcon className="size-3.5" /> : <PencilIcon className="size-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 pt-3">
        {topics.length === 0 && !isEditing ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">No topics tracked yet.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {topics.map((topic, index) =>
              isEditing ? (
                <div
                  key={`${topic}-${index}`}
                  className="flex items-center gap-1 rounded-full bg-muted/40 pl-2 ring-1 ring-inset ring-foreground/10"
                >
                  <Input
                    defaultValue={topic}
                    className="h-7 w-[8.5rem] border-0 bg-transparent px-1 text-[11px] shadow-none focus-visible:ring-0"
                    onKeyDown={(event) => handleTopicKeyDown(event, index)}
                    onBlur={(event) => {
                      const trimmed = event.currentTarget.value.trim();
                      if (!trimmed) {
                        handleRemoveTopic(topic);
                        return;
                      }

                      const nextTopics = [...topics];
                      nextTopics[index] = trimmed;
                      onTopicsChange(nextTopics);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-6 rounded-full text-muted-foreground"
                    onClick={() => handleRemoveTopic(topic)}
                    aria-label={`Remove ${topic}`}
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              ) : (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicClick(topic)}
                  className={cn(
                    "rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-inset ring-white/10 transition-all",
                    onTopicSelect && "cursor-pointer hover:brightness-110",
                    activeTopic === topic && "ring-2 ring-white ring-offset-2 ring-offset-primary",
                  )}
                >
                  {topic}
                </button>
              ),
            )}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleAddTopic} className="flex items-center gap-2 pt-1">
            <Input
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              placeholder="Add a topic"
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 shrink-0 px-3">
              Add
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
