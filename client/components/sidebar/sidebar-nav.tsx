"use client";

import { SidebarNavItem } from "@/components/sidebar/sidebar-nav-item";
import { SidebarTree } from "@/components/sidebar/sidebar-tree";
import { sidebarNavItems } from "@/lib/dashboard/data";

export function SidebarNav() {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        Overview
      </p>
      <ul className="space-y-0.5">
        {sidebarNavItems.map((item) => (
          <li key={item.label}>
            <SidebarNavItem item={item} />
            {"active" in item && item.active && item.label === "Project Board" && (
              <SidebarTree />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
