"use client";

import { CreateCalendarEventPanel } from "@/components/home/create-calendar-event-dialog";
import { Button } from "@/components/ui/button";
import { useGoogleAgenda } from "@/lib/home/use-google-agenda";
import { getDateKey } from "@/lib/home/google-agenda-utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MAX_VISIBLE_DOTS = 5;
const PANEL_WIDTH = 288;
const PANEL_GAP = 12;

function DayEventDots({ taskCount }: { taskCount: number }) {
  if (taskCount <= 0) {
    return <span className="h-1" aria-hidden />;
  }

  const dotCount = Math.min(taskCount, MAX_VISIBLE_DOTS);

  return (
    <div
      className="flex h-1 min-w-7 items-center justify-center gap-px"
      aria-hidden
    >
      {Array.from({ length: dotCount }, (_, index) => (
        <span key={index} className="size-1 shrink-0 rounded-full bg-primary" />
      ))}
    </div>
  );
}

function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

type PanelAnchor = {
  top: number;
  left: number;
};

function getPanelAnchor(rect: DOMRect): PanelAnchor {
  const viewportPadding = 12;
  const preferredLeft = rect.left - PANEL_WIDTH - PANEL_GAP;
  const left = Math.max(viewportPadding, preferredLeft);
  const top = Math.max(
    viewportPadding,
    Math.min(rect.top, window.innerHeight - viewportPadding - 360),
  );

  return { top, left };
}

export function CalendarWidget() {
  const { isLoaded } = useAuth();
  const { events, connected, reloadForMonth, createEvent, setSelectedDate, selectedDateKey } =
    useGoogleAgenda();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDateLocal] = useState<Date | null>(null);
  const [panelAnchor, setPanelAnchor] = useState<PanelAnchor | null>(null);
  const [calendarFocusedDateKey, setCalendarFocusedDateKey] = useState<string | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void reloadForMonth(cursor.getFullYear(), cursor.getMonth());
  }, [cursor, isLoaded, reloadForMonth]);

  const days = useMemo(
    () => getMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();

    for (const event of events) {
      counts.set(event.dateKey, (counts.get(event.dateKey) ?? 0) + 1);
    }

    return counts;
  }, [events]);

  const canSelectDays = events.length > 0 || connected === true;

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleDayClick = (date: Date, rect: DOMRect) => {
    if (!canSelectDays) {
      return;
    }

    const dateKey = getDateKey(date);
    const isSecondClickOnSameDay =
      selectedDateKey === dateKey && calendarFocusedDateKey === dateKey;

    if (isSecondClickOnSameDay) {
      if (panelAnchor) {
        finishDayInteraction();
        return;
      }

      setSelectedDateLocal(date);
      setPanelAnchor(getPanelAnchor(rect));
      return;
    }

    setSelectedDate(date);
    setCalendarFocusedDateKey(dateKey);
    dismissCreatePanel();
  };

  const dismissCreatePanel = () => {
    setSelectedDateLocal(null);
    setPanelAnchor(null);
  };

  const finishDayInteraction = () => {
    dismissCreatePanel();
    setCalendarFocusedDateKey(null);
  };

  const panel =
    mounted && selectedDate && panelAnchor ? (
      createPortal(
        <div
          className="fixed z-[200]"
          style={{ top: panelAnchor.top, left: panelAnchor.left, width: PANEL_WIDTH }}
        >
          <CreateCalendarEventPanel
            date={selectedDate}
            onClose={finishDayInteraction}
            onCreate={createEvent}
          />
        </div>,
        document.body,
      )
    ) : null;

  return (
    <>
      {panel}

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm font-semibold text-foreground">
            {monthLabel}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => {
                finishDayInteraction();
                setCursor(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                );
              }}
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => {
                finishDayInteraction();
                setCursor(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                );
              }}
              aria-label="Next month"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
          ))}

          {days.map((date) => {
            const dateKey = getDateKey(date);
            const isCurrentMonth = date.getMonth() === cursor.getMonth();
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();
            const isSelected =
              panelAnchor !== null &&
              selectedDate !== null &&
              getDateKey(selectedDate) === dateKey;
            const taskCount = eventCountByDate.get(dateKey) ?? 0;
            const hasEvents = taskCount > 0;
            const taskLabel = `+${taskCount} events`;

            return (
              <div
                key={date.toISOString()}
                className="relative flex flex-col items-center justify-center gap-1 py-0.5"
              >
                <button
                  type="button"
                  aria-label={
                    hasEvents
                      ? `${date.getDate()}, ${taskCount} events. Click to view events, click again to create.`
                      : `${date.getDate()}. Click to view events, click again to create.`
                  }
                  onClick={(event) =>
                    handleDayClick(date, event.currentTarget.getBoundingClientRect())
                  }
                  className={cn(
                    "group/date relative z-10 flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isSelected
                      ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                      : isToday
                        ? "bg-primary text-primary-foreground"
                        : hasEvents
                          ? "text-foreground hover:bg-primary/15 hover:text-primary"
                          : isCurrentMonth
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground/40 hover:bg-muted",
                  )}
                >
                  {date.getDate()}
                  {hasEvents ? (
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-foreground shadow-lg group-hover/date:block">
                      {taskLabel}
                    </span>
                  ) : null}
                </button>
                <DayEventDots taskCount={taskCount} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
