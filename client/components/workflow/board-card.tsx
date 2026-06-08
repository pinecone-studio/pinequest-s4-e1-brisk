"use client";

import { cn } from "@/lib/utils";
import type { GithubProjectItem } from "@/lib/integrations/github";
import { projectItemTypeBadge } from "./workflow-utils";
import { ExternalLink } from "lucide-react";

type BoardCardProps = {
  item: GithubProjectItem;
  onDragStart: (itemId: string) => void;
  onDragEnd: () => void;
};

export function BoardCard({ item, onDragStart, onDragEnd }: BoardCardProps) {
  const badge = projectItemTypeBadge(item.type);
  const content = item.content;

  const title = content ? content.title : "Untitled item";
  const hasNumber =
    content?.type === "Issue" || content?.type === "PullRequest";
  const number = hasNumber ? content.number : null;
  const url = hasNumber ? content.url : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
      className="cursor-grab rounded-xl border border-border/60 bg-card p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            badge.className,
          )}
        >
          {badge.label}
        </span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Open on GitHub"
          >
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
      <p className="mt-1.5 line-clamp-3 text-sm text-foreground">
        {number !== null ? (
          <span className="text-muted-foreground">#{number} </span>
        ) : null}
        {title}
      </p>
    </div>
  );
}
