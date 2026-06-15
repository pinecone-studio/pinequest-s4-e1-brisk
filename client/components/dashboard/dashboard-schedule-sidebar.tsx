import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";
import { GoogleAgendaProvider } from "@/lib/home/google-agenda-context";

export function DashboardScheduleSidebar() {
  return (
    <GoogleAgendaProvider>
      <aside className="relative z-20 hidden h-full w-80 shrink-0 flex-col gap-6 overflow-visible border-l border-border bg-card/40 p-6 backdrop-blur-sm xl:flex">
        <CalendarWidget />
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          <AgendaPanel />
        </div>
      </aside>
    </GoogleAgendaProvider>
  );
}
