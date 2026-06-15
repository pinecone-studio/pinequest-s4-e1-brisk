"use client";

import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { MoonIcon, SearchIcon, SunIcon } from "lucide-react";

const topbarIconButtonClass =
  "size-9 shrink-0 rounded-xl border-0 bg-transparent shadow-none hover:bg-foreground/5 focus-visible:border-0 focus-visible:ring-0";

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 bg-transparent px-4 lg:px-6">
      <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground lg:hidden">
        B
      </div>

      <div className="relative max-w-md flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search or ask anything across your meetings..."
          className="h-10 rounded-full border-0 bg-transparent pl-9 pr-16 shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
          Ctrl+K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsMenu triggerClassName={topbarIconButtonClass} />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle appearance"
          className={cn(
            topbarIconButtonClass,
            "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? (
            <SunIcon className="size-4.5" />
          ) : (
            <MoonIcon className="size-4.5" />
          )}
        </Button>
        <UserButton
          appearance={{
            elements: {
              userButtonTrigger: cn(
                topbarIconButtonClass,
                "focus:shadow-none focus-visible:shadow-none",
              ),
              avatarBox: "size-7 rounded-lg",
            },
          }}
        />
      </div>
    </header>
  );
}
