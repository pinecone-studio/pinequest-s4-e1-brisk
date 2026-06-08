import type {
  GithubProjectField,
  GithubProjectItem,
  GithubPullItem,
} from "@/lib/integrations/github";

export function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function prStatusBadge(state: string) {
  if (state === "open") return { label: "Open", className: "bg-emerald-500/10 text-emerald-600" };
  if (state === "merged") return { label: "Merged", className: "bg-violet-500/10 text-violet-600" };
  return { label: "Closed", className: "bg-muted text-muted-foreground" };
}

export function mergeableLabel(pull: GithubPullItem) {
  if (pull.mergeable === false) return { text: "Conflicts must be resolved", tone: "error" as const };
  const state = pull.mergeable_state ?? "unknown";
  if (state === "blocked") return { text: "Blocked by required reviews or checks", tone: "warn" as const };
  if (state === "dirty") return { text: "Merge conflicts", tone: "error" as const };
  if (state === "unstable") return { text: "Failing checks", tone: "warn" as const };
  if (state === "clean") return { text: "Ready to merge", tone: "ok" as const };
  return { text: "Merge status unknown", tone: "muted" as const };
}

export function canMerge(pull: GithubPullItem) {
  return (
    pull.state === "open" &&
    !pull.draft &&
    pull.mergeable !== false &&
    (pull.mergeable_state === "clean" || pull.mergeable_state === "unstable")
  );
}

// --- Projects v2 board helpers ---

export const STATUS_FIELD_NAME = "Status";

// Columns are driven by a single-select field. Prefer one literally named
// "Status"; otherwise fall back to the first single-select field so a board
// still renders (the UI surfaces a note when falling back).
export function findStatusField(
  fields: GithubProjectField[],
): GithubProjectField | undefined {
  const singleSelects = fields.filter((f) => f.dataType === "SINGLE_SELECT");
  const named = singleSelects.find(
    (f) => f.name.toLowerCase() === STATUS_FIELD_NAME.toLowerCase(),
  );
  return named ?? singleSelects[0];
}

export function getItemStatusOptionId(
  item: GithubProjectItem,
  statusFieldId: string,
): string | null {
  return item.fieldValues.find((v) => v.fieldId === statusFieldId)?.optionId ?? null;
}

export type BoardColumnData = {
  optionId: string | null; // null = the synthetic "No Status" column
  name: string;
  items: GithubProjectItem[];
};

// One column per Status option (in field order), plus a trailing "No Status"
// bucket for items whose Status is unset.
export function groupItemsByStatus(
  items: GithubProjectItem[],
  statusField: GithubProjectField,
): BoardColumnData[] {
  const columns: BoardColumnData[] = (statusField.options ?? []).map((opt) => ({
    optionId: opt.id,
    name: opt.name,
    items: [],
  }));
  const noStatus: BoardColumnData = { optionId: null, name: "No Status", items: [] };

  const byOption = new Map<string, BoardColumnData>();
  for (const col of columns) if (col.optionId) byOption.set(col.optionId, col);

  for (const item of items) {
    const optionId = getItemStatusOptionId(item, statusField.id);
    const target = optionId ? byOption.get(optionId) : undefined;
    (target ?? noStatus).items.push(item);
  }

  return [...columns, noStatus];
}

export function projectItemTypeBadge(type: GithubProjectItem["type"]) {
  if (type === "PULL_REQUEST")
    return { label: "PR", className: "bg-violet-500/10 text-violet-600" };
  if (type === "DRAFT_ISSUE")
    return { label: "Draft", className: "bg-muted text-muted-foreground" };
  return { label: "Issue", className: "bg-emerald-500/10 text-emerald-600" };
}
