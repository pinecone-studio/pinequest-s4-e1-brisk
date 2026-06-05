"use client";

import {
  taskColumnConfig,
  taskPriorities,
  taskStatuses,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle2, Trash2, X } from "lucide-react";

type TaskDetailPanelProps = {
  task: TaskListItem;
  onUpdate: (taskId: string, update: TaskUpdate) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
};

function formatOption(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDueDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const inputClass =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-violet-500";

const textareaClass =
  "min-h-28 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function TaskDetailPanel({
  task,
  onUpdate,
  onDelete,
  onClose,
}: TaskDetailPanelProps) {
  const dueDateValue = task.dueDate.slice(0, 10).replaceAll(".", "-");
  const primaryMember = task.members[0] ?? "Unassigned";
  const update = (change: TaskUpdate) => onUpdate(task.id, change);

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border/60 bg-[#16171b] shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <Button
          type="button"
          variant={task.status === "done" ? "default" : "outline"}
          className="rounded-lg"
          onClick={() =>
            update({ status: task.status === "done" ? "doing" : "done" })
          }
        >
          <CheckCircle2 className="size-4" />
          {task.status === "done" ? "Completed" : "Mark complete"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-lg"
          onClick={onClose}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <input
          className="w-full border-0 bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground"
          value={task.title}
          placeholder="Task name"
          onChange={(event) => update({ title: event.target.value })}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <DetailField label="Assignee">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-violet-500 text-xs text-white">
                  {primaryMember.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{primaryMember}</span>
            </div>
          </DetailField>

          <DetailField label="Due date">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className={cn(inputClass, "pl-9")}
                inputMode="numeric"
                placeholder="YYYY-MM-DD"
                value={dueDateValue}
                onChange={(event) => update({ dueDate: event.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDueDate(task.dueDate)}
            </p>
          </DetailField>

          <DetailField label="Team">
            <div className="rounded-lg border border-border/60 px-3 py-2 text-sm">
              {task.team}
            </div>
          </DetailField>

          <DetailField label="Tool">
            <input
              className={inputClass}
              value={task.tool}
              onChange={(event) => update({ tool: event.target.value })}
            />
          </DetailField>

          <DetailField label="Status">
            <select
              className={inputClass}
              value={task.status}
              onChange={(event) =>
                update({ status: event.target.value as TaskStatus })
              }
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {taskColumnConfig[status].label}
                </option>
              ))}
            </select>
          </DetailField>

          <DetailField label="Priority">
            <select
              className={inputClass}
              value={task.priority}
              onChange={(event) =>
                update({ priority: event.target.value as TaskPriority })
              }
            >
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatOption(priority)}
                </option>
              ))}
            </select>
          </DetailField>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-md capitalize">
            {task.source}
          </Badge>
          {task.blocked ? (
            <Badge variant="destructive" className="rounded-md">
              Blocked
            </Badge>
          ) : null}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold">Description</h3>
          <textarea
            className={cn(textareaClass, "mt-2")}
            placeholder="What is this task about?"
            value={task.description ?? ""}
            onChange={(event) => update({ description: event.target.value })}
          />
        </div>

        <Button
          type="button"
          variant="destructive"
          className="mt-6 rounded-lg"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="size-4" />
          Delete task
        </Button>
      </div>
    </aside>
  );
}
