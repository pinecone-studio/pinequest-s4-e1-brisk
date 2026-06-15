"use client";

import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";
import { useEffect } from "react";

export const useRegisterSearchSuggestions = (
  sourceId: string,
  suggestions: SearchSuggestion[],
) => {
  const { registerSuggestions, unregisterSuggestions } = useDashboardSearch();

  useEffect(() => {
    registerSuggestions(sourceId, suggestions);
    return () => unregisterSuggestions(sourceId);
  }, [registerSuggestions, sourceId, suggestions, unregisterSuggestions]);
};
