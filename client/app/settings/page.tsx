"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useDashboardSearch } from "@/lib/search/dashboard-search-context";
import { SETTINGS_SEARCH_SUGGESTIONS } from "@/lib/search/build-search-suggestions";
import { matchesSearchQuery } from "@/lib/search/matches-search-query";
import { useRegisterSearchSuggestions } from "@/lib/search/use-register-search-suggestions";

const SETTINGS_CONTENT = [
  {
    title: "Settings",
    description: "Manage your Brisk account and meeting preferences.",
  },
  {
    title: "Account preferences",
    description: "Account preferences are coming soon.",
  },
];

export default function SettingsPage() {
  useRegisterSearchSuggestions("settings", SETTINGS_SEARCH_SUGGESTIONS);
  const { query } = useDashboardSearch();
  const visibleContent = SETTINGS_CONTENT.filter((item) =>
    matchesSearchQuery(query, item.title, item.description),
  );
  const heading = visibleContent[0] ?? SETTINGS_CONTENT[0];
  const body = visibleContent[1] ?? SETTINGS_CONTENT[1];

  if (query.trim() && visibleContent.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-4 text-center lg:p-6">
        <p className="font-medium text-foreground">No matching settings</p>
        <p className="text-sm text-muted-foreground">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {heading.title}
        </h1>
        <p className="text-sm text-muted-foreground">{heading.description}</p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground">{body.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
