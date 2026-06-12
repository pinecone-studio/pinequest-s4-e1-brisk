"use client";

import { useCallback } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ArrowLeftRight,
  Code2,
  Compass,
  Database,
  FlaskConical,
  GripVertical,
  Monitor,
  Network,
  User,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { TddTiptapAgentEditor } from "@/components/onboarding/tiptap/TddTiptapAgentEditor";
import type {
  TddBlock,
  TddBlockType,
  TddLayoutState,
} from "@/lib/onboarding/tdd-types";
import { cn } from "@/lib/utils";

type TddDraggableCanvasProps = {
  layout: TddLayoutState;
  onLayoutChange: (layout: TddLayoutState) => void;
  projectName?: string;
  sessionKey?: string;
};

type BlockVisual = {
  icon: LucideIcon;
  badgeClass: string;
  span: string;
};

const BLOCK_VISUALS: Record<TddBlockType, BlockVisual> = {
  project_overview: {
    icon: Compass,
    badgeClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    span: "",
  },
  core_features: {
    icon: Workflow,
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    span: "",
  },
  database_schema: {
    icon: Database,
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    span: "xl:col-span-2",
  },
  tdd_specs: {
    icon: FlaskConical,
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    span: "xl:col-span-2",
  },
};

function reorderBlocks(
  blocks: TddBlock[],
  sourceIndex: number,
  destinationIndex: number,
): TddBlock[] {
  const next = [...blocks];
  const [removed] = next.splice(sourceIndex, 1);
  next.splice(destinationIndex, 0, removed);
  return next.map((block, index) => ({ ...block, order: index }));
}

type TddBlockCardProps = {
  block: TddBlock;
  index: number;
  onContentChange: (blockId: string, content: string) => void;
};

function TddBlockCard({
  block,
  sessionKey,
  onContentChange,
}: TddBlockCardProps & { sessionKey: string }) {
  return (
    <TddTiptapAgentEditor
      block={block}
      sessionKey={sessionKey}
      onContentChange={(content) => onContentChange(block.id, content)}
    />
  );
}

function ArchitectureNode({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center shadow-sm sm:w-40">
      <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-[12px] font-medium italic text-foreground">{label}</p>
    </div>
  );
}

function ArchitectureConnector() {
  return (
    <div className="flex flex-1 items-center text-muted-foreground/50">
      <div className="h-px flex-1 bg-border" />
      <ArrowLeftRight className="mx-1.5 size-4 shrink-0" />
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function SystemArchitectureDiagram({ projectName }: { projectName: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm xl:col-span-2">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Network className="size-4" />
        </span>
        <h3 className="flex-1 text-sm font-semibold text-foreground">
          System Architecture
        </h3>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-6 sm:gap-2">
        <ArchitectureNode icon={User} label="User" />
        <ArchitectureConnector />
        <ArchitectureNode
          icon={Monitor}
          label={projectName.trim() || "Web Application"}
        />
        <ArchitectureConnector />
        <ArchitectureNode icon={Code2} label="External APIs" />
      </div>
    </div>
  );
}

export function TddDraggableCanvas({
  layout,
  onLayoutChange,
  projectName = "",
  sessionKey = "local",
}: TddDraggableCanvasProps) {
  const sortedBlocks = [...layout.blocks].sort(
    (left, right) => left.order - right.order,
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) {
        return;
      }
      onLayoutChange({
        blocks: reorderBlocks(sortedBlocks, sourceIndex, destinationIndex),
      });
    },
    [onLayoutChange, sortedBlocks],
  );

  const updateBlockContent = useCallback(
    (blockId: string, content: string) => {
      onLayoutChange({
        blocks: sortedBlocks.map((block) =>
          block.id === blockId ? { ...block, content } : block,
        ),
      });
    },
    [onLayoutChange, sortedBlocks],
  );

  return (
    <div className="flex flex-col gap-5 pb-2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tdd-canvas">
          {(droppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              className="grid grid-cols-1 gap-5 xl:grid-cols-2"
            >
              {sortedBlocks.map((block, index) => {
                const visual = BLOCK_VISUALS[block.type];
                const Icon = visual.icon;
                return (
                  <Draggable
                    key={block.id}
                    draggableId={block.id}
                    index={index}
                  >
                    {(draggableProvided, snapshot) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        className={cn(
                          "transition-shadow",
                          visual.span,
                          snapshot.isDragging &&
                            "shadow-lg ring-2 ring-violet-500/30",
                        )}
                      >
                        <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-border bg-card shadow-sm">
                          <div
                            className="flex items-center gap-3 border-b border-border px-4 py-3"
                            {...draggableProvided.dragHandleProps}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                visual.badgeClass,
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <h3 className="flex-1 text-sm font-semibold text-foreground">
                              {block.title}
                            </h3>
                            <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                          </div>
                          <TddBlockCard
                            block={block}
                            index={index}
                            sessionKey={sessionKey}
                            onContentChange={updateBlockContent}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <SystemArchitectureDiagram projectName={projectName} />
    </div>
  );
}
