"use client";

import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { SearchSuggestions } from "@/components/dashboard/search-suggestions";
import { BriskLogo } from "@/components/brisk-logo";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterSearchSuggestions } from "@/lib/search/filter-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { getSearchPlaceholder } from "@/lib/search/get-search-placeholder";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { CLERK_GOOGLE_ADDITIONAL_SCOPES } from "@/lib/google/google-oauth-scopes";
import { MoonIcon, SearchIcon, SunIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const topbarIconButtonClass =
  "size-9 shrink-0 rounded-xl border-0 bg-transparent shadow-none hover:bg-foreground/5 focus-visible:border-0 focus-visible:ring-0";

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const {
    inputValue,
    setInputValue,
    submitSearch,
    suggestions,
    activeSuggestionIndex,
    inputRef,
    focusSearch,
  } = useDashboardSearch();
  const [shortcutLabel, setShortcutLabel] = useState("Ctrl+K");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setShortcutLabel(/Mac|iPhone|iPad/i.test(navigator.platform) ? "⌘K" : "Ctrl+K");
  }, []);

  return (
    <header className="flex h-16 w-full min-w-0 shrink-0 items-center gap-3 bg-transparent px-4 lg:col-start-2 lg:row-start-1 lg:px-6">
        <BriskLogo className="shrink-0 lg:hidden" />

        <div className="relative max-w-md flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const filtered = filterSearchSuggestions(suggestions, inputValue);
              submitSearch(undefined, filtered[activeSuggestionIndex]);
              setShowSuggestions(false);
              inputRef.current?.blur();
              return;
            }

            if (event.key === "Escape") {
              setShowSuggestions(false);
            }
          }}
          placeholder={getSearchPlaceholder(pathname)}
          aria-label="Search current page"
          aria-expanded={showSuggestions && Boolean(inputValue.trim())}
          aria-autocomplete="list"
          role="combobox"
          className="h-10 rounded-full border border-border bg-card/70 pl-9 pr-16 shadow-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <button
          type="button"
          onClick={focusSearch}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
          aria-label="Focus search"
        >
          {shortcutLabel}
        </button>

        {showSuggestions ? (
          <SearchSuggestions
            isOpen={showSuggestions}
            onClose={() => setShowSuggestions(false)}
          />
        ) : null}
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
            userProfileProps={{
              additionalOAuthScopes: {
                google: [...CLERK_GOOGLE_ADDITIONAL_SCOPES],
              },
            }}
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
