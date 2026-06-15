"use client";

import { filterSearchSuggestions } from "@/lib/search/filter-search-suggestions";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SearchSuggestionsProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function SearchSuggestions({
  isOpen,
  onClose,
  onSubmit,
}: SearchSuggestionsProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    inputValue,
    suggestions,
    submitSearch,
    setInputValue,
  } = useDashboardSearch();
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredSuggestions = useMemo(
    () => filterSearchSuggestions(suggestions, inputValue),
    [inputValue, suggestions],
  );

  const handleSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setInputValue(suggestion.title);
      submitSearch(suggestion.title);
      onClose();

      if (suggestion.href?.startsWith("/")) {
        router.push(suggestion.href);
      }
    },
    [onClose, router, setInputValue, submitSearch],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [inputValue, filteredSuggestions.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !inputValue.trim()) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredSuggestions.length
            ? (current + 1) % filteredSuggestions.length
            : 0,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredSuggestions.length
            ? (current - 1 + filteredSuggestions.length) % filteredSuggestions.length
            : 0,
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const activeSuggestion = filteredSuggestions[activeIndex];
        if (activeSuggestion) {
          handleSelect(activeSuggestion);
          return;
        }

        onSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeIndex,
    filteredSuggestions,
    handleSelect,
    inputValue,
    isOpen,
    onSubmit,
  ]);

  if (!isOpen || !inputValue.trim()) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg"
    >
      {filteredSuggestions.length > 0 ? (
        <ul className="max-h-72 overflow-y-auto py-1">
          {filteredSuggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent",
                  index === activeIndex && "bg-accent",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(suggestion)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {suggestion.title}
                  </span>
                  {suggestion.subtitle ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {suggestion.subtitle}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {suggestion.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-3 py-4 text-sm text-muted-foreground">
          Press Enter to search for &quot;{inputValue.trim()}&quot;
        </div>
      )}

      <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
        Use arrow keys to browse suggestions, Enter to search
      </div>
    </div>
  );
}
