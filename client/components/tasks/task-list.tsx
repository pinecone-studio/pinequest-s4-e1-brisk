"use client";

import { createMockTask } from "@/components/tasks/task-factory";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskListSkeleton } from "@/components/tasks/task-list-states";
import { readStoredTasks, saveStoredTasks } from "@/components/tasks/task-storage";
import { mockTasks, sourceLabels, taskSources } from "@/components/tasks/mock-tasks";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskTeamFilter } from "@/components/tasks/task-team-filter";
import {
  getTaskTeam,
  type TaskListItem,
  type TaskSource,
  type TaskStatus,
  type TaskUpdate,
} from "@/components/tasks/task-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ListTodo, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export function TaskList() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activeSource, setActiveSource] = useState<TaskSource>("github");
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sourceTasks = useMemo(
    () => tasks.filter((task) => task.source === activeSource),
    [activeSource, tasks]
  );
  const visibleTasks = useMemo(
    () =>
      activeTeam
        ? sourceTasks.filter((task) => getTaskTeam(task) === activeTeam)
        : sourceTasks,
    [activeTeam, sourceTasks]
  );
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const loadMockTasks = useCallback(() => {
    setIsLoading(true);

    window.setTimeout(() => {
      setTasks(readStoredTasks() ?? mockTasks);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    loadMockTasks();
  }, [loadMockTasks]);

  useEffect(() => {
    if (!isLoading) {
      saveStoredTasks(tasks);
    }
  }, [isLoading, tasks]);

  useEffect(() => {
    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks]);

  const updateTask = useCallback((taskId: string, update: TaskUpdate) => {
    setTasks((current) => {
      const next = current.map((task) =>
        task.id === taskId ? { ...task, ...update } : task,
      );
      saveStoredTasks(next);
      return next;
    });
  }, []);

  const addTaskToColumn = useCallback(
    (status: TaskStatus) => {
      const team = activeTeam ?? sourceTasks[0]?.team ?? "General Team";
      const newTask = createMockTask(activeSource, tasks.length + 1, team, status);

      setTasks((current) => {
        const next = [newTask, ...current];
        saveStoredTasks(next);
        return next;
      });
    },
    [activeSource, activeTeam, sourceTasks, tasks.length]
  );

  const deleteTask = useCallback((taskId: string) => {
    setTasks((current) => {
      const next = current.filter((task) => task.id !== taskId);
      saveStoredTasks(next);
      return next;
    });
    setSelectedTaskId((current) => (current === taskId ? null : current));
  }, []);

  return (
    <>
      <Card className="rounded-lg border border-border/60 bg-[#16171b] shadow-none">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="size-5 text-violet-400" />
            Task list
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            disabled={isLoading}
            onClick={loadMockTasks}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {taskSources.map((source) => (
            <button
              key={source}
              type="button"
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                activeSource === source
                  ? "border-violet-500 bg-violet-500 text-white"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                setActiveSource(source);
                setActiveTeam(null);
                setSelectedTaskId(null);
              }}
            >
              {sourceLabels[source]}
            </button>
          ))}
        </div>
        <TaskTeamFilter
          activeTeam={activeTeam}
          tasks={sourceTasks}
          onChange={setActiveTeam}
        />

        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <div className="min-h-[28rem] overflow-x-auto rounded-lg border border-border/60 p-3">
            <TaskBoard
              tasks={visibleTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              onAddTask={addTaskToColumn}
              onUpdateTask={updateTask}
            />
          </div>
        )}
      </CardContent>
    </Card>

      {selectedTask ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Close task details"
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskDetailPanel
            task={selectedTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onClose={() => setSelectedTaskId(null)}
          />
        </>
      ) : null}
    </>
  );
}
