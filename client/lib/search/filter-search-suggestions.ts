import { matchesSearchQuery } from "@/lib/search/matches-search-query";
import type { SearchSuggestion } from "@/lib/search/search-suggestion.types";

export const filterSearchSuggestions = (
  suggestions: SearchSuggestion[],
  query: string,
  limit = 8,
) => {
  if (!query.trim()) return [];

  return suggestions
    .filter((suggestion) =>
      matchesSearchQuery(
        query,
        suggestion.title,
        suggestion.subtitle,
        suggestion.category,
        ...(suggestion.keywords ?? []),
      ),
    )
    .slice(0, limit);
};
