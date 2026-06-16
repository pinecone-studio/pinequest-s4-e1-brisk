"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { parseInviteEmails } from "@/lib/summary/resolve-assignee-email";
import { cn } from "@/lib/utils";
import { MailIcon, XIcon } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";

type InviteEmailListProps = {
  emails: string[];
  onEmailsChange: (emails: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Inline matches the h-13 quick-action row; stacked shows helper text below. */
  layout?: "inline" | "stacked";
};

export function InviteEmailList({
  emails,
  onEmailsChange,
  placeholder = "Add teammate emails",
  className,
  layout = "stacked",
}: InviteEmailListProps) {
  const [draft, setDraft] = useState("");
  const isInline = layout === "inline";

  const addEmails = (value: string) => {
    const next = [...emails];
    const seen = new Set(next);

    for (const email of parseInviteEmails(value)) {
      if (!seen.has(email)) {
        seen.add(email);
        next.push(email);
      }
    }

    onEmailsChange(next);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) {
        addEmails(draft);
      }
    }

    if (event.key === "Backspace" && !draft && emails.length > 0) {
      onEmailsChange(emails.slice(0, -1));
    }
  };

  const helperText = useMemo(() => {
    if (emails.length === 0) {
      return "Press Enter after each email. Invites are queued when the meeting starts.";
    }
    return `${emails.length} invite${emails.length === 1 ? "" : "s"} ready`;
  }, [emails.length]);

  const field = (
    <div
      className={cn(
        "flex w-full items-center gap-2 rounded-2xl bg-transparent ring-1 ring-border/60 focus-within:ring-2 focus-within:ring-primary/50",
        isInline ? "h-13 px-3" : "min-h-13 px-3 py-2",
      )}
    >
      <MailIcon
        className={cn(
          "shrink-0 text-muted-foreground/80",
          isInline ? "size-5" : "size-5 self-start mt-3.5",
        )}
      />

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5",
          isInline ? "flex-nowrap overflow-x-auto scrollbar-none" : "flex-wrap",
        )}
      >
        {emails.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className={cn(
              "max-w-full shrink-0 gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs font-medium",
              isInline && "max-w-[8rem]",
            )}
            title={email}
          >
            <span className="truncate">{email}</span>
            <button
              type="button"
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Remove ${email}`}
              onClick={() => onEmailsChange(emails.filter((item) => item !== email))}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}

        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) addEmails(draft);
          }}
          placeholder={emails.length === 0 ? placeholder : "Add another email"}
          aria-label={placeholder}
          title={isInline ? helperText : undefined}
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
            isInline ? "h-9 min-w-[9rem] text-base" : "h-8 min-w-[10rem] text-base",
          )}
        />
      </div>
    </div>
  );

  if (isInline) {
    return <div className={cn("min-w-0 flex-1", className)}>{field}</div>;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {field}
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}
