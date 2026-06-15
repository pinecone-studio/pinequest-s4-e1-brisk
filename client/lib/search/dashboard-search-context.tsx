"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";

type DashboardSearchContextValue = {
  query: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  submitSearch: (value?: string) => void;
  clearSearch: () => void;
  suggestions: SearchSuggestion[];
  registerSuggestions: (sourceId: string, items: SearchSuggestion[]) => void;
  unregisterSuggestions: (sourceId: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
};

const DashboardSearchContext = createContext<DashboardSearchContextValue | null>(
  null,
);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [suggestionSources, setSuggestionSources] = useState<
    Map<string, SearchSuggestion[]>
  >(() => new Map());
  const inputRef = useRef<HTMLInputElement>(null);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setInputValue("");
  }, []);

  const submitSearch = useCallback((value?: string) => {
    const nextQuery = (value ?? inputRef.current?.value ?? inputValue).trim();
    setInputValue(nextQuery);
    setQuery(nextQuery);
  }, [inputValue]);

  const registerSuggestions = useCallback(
    (sourceId: string, items: SearchSuggestion[]) => {
      setSuggestionSources((current) => {
        const next = new Map(current);
        next.set(sourceId, items);
        return next;
      });
    },
    [],
  );

  const unregisterSuggestions = useCallback((sourceId: string) => {
    setSuggestionSources((current) => {
      if (!current.has(sourceId)) return current;

      const next = new Map(current);
      next.delete(sourceId);
      return next;
    });
  }, []);

  useEffect(() => {
    clearSearch();
  }, [pathname, clearSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearch();
        return;
      }

      if (
        event.key === "Escape" &&
        document.activeElement === inputRef.current
      ) {
        clearSearch();
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearSearch, focusSearch]);

  const suggestions = useMemo(
    () => [...suggestionSources.values()].flat(),
    [suggestionSources],
  );

  const value = useMemo(
    () => ({
      query,
      inputValue,
      setInputValue,
      submitSearch,
      clearSearch,
      suggestions,
      registerSuggestions,
      unregisterSuggestions,
      inputRef,
      focusSearch,
    }),
    [
      query,
      inputValue,
      submitSearch,
      clearSearch,
      suggestions,
      registerSuggestions,
      unregisterSuggestions,
      focusSearch,
    ],
  );

  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export const useDashboardSearch = () => {
  const context = useContext(DashboardSearchContext);

  if (!context) {
    throw new Error("useDashboardSearch must be used within DashboardSearchProvider");
  }

  return context;
};
