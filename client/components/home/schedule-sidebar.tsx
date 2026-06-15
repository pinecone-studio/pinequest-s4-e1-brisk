import { AgendaPanel } from "@/components/home/agenda-panel";
import { CalendarWidget } from "@/components/home/calendar-widget";
import { GoogleAgendaProvider } from "@/lib/home/google-agenda-context";

export function ScheduleSidebar() {
  return (
    <GoogleAgendaProvider>
      <aside className="relative z-20 hidden h-full w-full shrink-0 flex-col gap-6 overflow-visible border-t border-border px-6 py-4 lg:flex lg:w-[30%] lg:border-t-0 lg:py-6">
        <CalendarWidget />
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
          <AgendaPanel />
        </div>
      </aside>
    </GoogleAgendaProvider>
  );
}
