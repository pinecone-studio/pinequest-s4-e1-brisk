"use client";

import { MeetingProviders } from "@/app/meeting/components/meeting-providers";
import { ClientAuthSetup } from "@/components/client-auth-setup";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { DashboardScheduleSidebar } from "@/components/dashboard/dashboard-schedule-sidebar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardSearchProvider } from "@/lib/search/dashboard-search-context";

export function DashboardAppShell({ children }: { children: React.ReactNode }) {
  return (
    <MeetingProviders>
      <DashboardSearchProvider>
        <div className="dashboard-shell flex h-screen flex-col overflow-hidden lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:grid-rows-[4rem_minmax(0,1fr)]">
          <ClientAuthSetup />
          <Topbar />
          <Sidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:col-start-2 lg:row-start-2">
            <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden pb-16 lg:pb-0">
              <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {children}
              </main>
              <DashboardScheduleSidebar />
            </div>
            <BottomNav />
          </div>
        </div>
      </DashboardSearchProvider>
    </MeetingProviders>
  );
}
