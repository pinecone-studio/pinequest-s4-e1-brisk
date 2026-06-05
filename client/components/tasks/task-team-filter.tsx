"use client";

import { getTaskTeam, type TaskListItem } from "@/components/tasks/task-types";
import { cn } from "@/lib/utils";
import {
  Clock,
  Code2,
  LayoutGrid,
  MessageCircle,
  MoreVertical,
  Palette,
  Paperclip,
  PieChart,
  Plus,
} from "lucide-react";
import { useMemo } from "react";

type TaskTeamFilterProps = {
  activeTeam: string | null;
  tasks: TaskListItem[];
  onChange: (team: string | null) => void;
};

type TeamSummary = {
  name: string;
  tool: string;
  members: string[];
  progress: number;
  timeLeft: string;
  doneCount: number;
  blockedCount: number;
};

const memberColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
];

const teamVisuals = [
  {
    match: /backend/i,
    icon: LayoutGrid,
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
  },
  {
    match: /ux|ui|design/i,
    icon: Palette,
    iconClass: "text-sky-400",
    bgClass: "bg-sky-500/15",
  },
  {
    match: /front|frontend/i,
    icon: Code2,
    iconClass: "text-lime-400",
    bgClass: "bg-lime-500/15",
  },
  {
    match: /marketing|ops|qa|product/i,
    icon: PieChart,
    iconClass: "text-orange-400",
    bgClass: "bg-orange-500/15",
  },
] as const;

function buildTeamSummaries(tasks: TaskListItem[]): TeamSummary[] {
  const grouped = new Map<string, TaskListItem[]>();

  for (const task of tasks) {
    const team = getTaskTeam(task);
    const current = grouped.get(team) ?? [];
    current.push(task);
    grouped.set(team, current);
  }

  return Array.from(grouped.entries()).map(([name, teamTasks]) => {
    const members = [...new Set(teamTasks.flatMap((task) => task.members))];
    const progress = Math.round(
      teamTasks.reduce((sum, task) => sum + task.progress, 0) / teamTasks.length,
    );
    const leadTask =
      teamTasks.find((task) => task.team === name) ?? teamTasks[0];

    return {
      name,
      tool: leadTask.tool,
      members,
      progress,
      timeLeft: leadTask.timeLeft,
      doneCount: teamTasks.reduce((sum, task) => sum + task.doneCount, 0),
      blockedCount: teamTasks.reduce((sum, task) => sum + task.blockedCount, 0),
    };
  });
}

function getTeamVisual(name: string) {
  return (
    teamVisuals.find((visual) => visual.match.test(name)) ?? {
      icon: LayoutGrid,
      iconClass: "text-violet-400",
      bgClass: "bg-violet-500/15",
    }
  );
}

function getProgressColor(progress: number) {
  if (progress >= 75) {
    return "bg-emerald-500";
  }

  if (progress >= 50) {
    return "bg-violet-500";
  }

  return "bg-amber-500";
}

function TeamCard({
  team,
  active,
  onClick,
}: {
  team: TeamSummary;
  active: boolean;
  onClick: () => void;
}) {
  const visual = getTeamVisual(team.name);
  const Icon = visual.icon;
  const progress = Math.min(Math.max(team.progress, 0), 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-[240px] shrink-0 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors dark:bg-[#1f2024]",
        active
          ? "border-violet-500 border-dashed ring-1 ring-violet-500/40"
          : "border-border/70 hover:border-violet-400/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              visual.bgClass,
            )}
          >
            <Icon className={cn("size-4", visual.iconClass)} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{team.name}</h3>
            <p className="truncate text-xs text-muted-foreground">{team.tool}</p>
          </div>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground">
          <MoreVertical className="size-4" />
        </span>
      </div>

      <div className="mt-4 flex items-center">
        {team.members.slice(0, 4).map((member, index) => (
          <span
            key={`${team.name}-${member}`}
            className={cn(
              "grid size-8 place-items-center rounded-full border-2 border-card text-[11px] font-semibold text-white dark:border-[#1f2024]",
              index > 0 && "-ml-2",
              memberColors[index % memberColors.length],
            )}
          >
            {member}
          </span>
        ))}
        <span className="-ml-1 grid size-8 place-items-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground">
          <Plus className="size-4" />
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-4 text-xs font-medium">
          <span className="text-muted-foreground">Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", getProgressColor(progress))}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
          <Clock className="size-3.5" />
          {team.timeLeft}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5 text-violet-400" />
            {team.doneCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Paperclip className="size-3.5 text-orange-400" />
            {team.blockedCount}
          </span>
        </div>
      </div>
    </button>
  );
}

export function TaskTeamFilter({
  activeTeam,
  tasks,
  onChange,
}: TaskTeamFilterProps) {
  const teams = useMemo(() => buildTeamSummaries(tasks), [tasks]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Teams
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {teams.map((team) => (
          <TeamCard
            key={team.name}
            team={team}
            active={activeTeam === team.name}
            onClick={() => onChange(activeTeam === team.name ? null : team.name)}
          />
        ))}
      </div>
    </section>
  );
}
