"use client";

import { cn } from "@/lib/utils";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type AgentChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type TddAgentChatProps = {
  blockTitle: string;
  getContent: () => string;
  getSelection: () => string;
  onApplyContent: (content: string) => void;
  className?: string;
};

function createMessageId() {
  return crypto.randomUUID();
}

export function TddAgentChat({
  blockTitle,
  getContent,
  getSelection,
  onApplyContent,
  className,
}: TddAgentChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: createMessageId(),
      role: "assistant",
      text: "I'm your TDD editing agent. Ask me to refine, expand, or restructure this section.",
    },
  ]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const runAgent = useCallback(async () => {
    const instruction = input.trim();
    if (!instruction || running) {
      return;
    }

    setRunning(true);
    setError(null);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", text: instruction },
    ]);

    try {
      const response = await fetch("/api/tiptap/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockTitle,
          content: getContent(),
          selectedText: getSelection(),
          instruction,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        content?: string;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.content) {
        throw new Error(payload?.error ?? "Agent request failed");
      }

      onApplyContent(payload.content);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          text: payload.message ?? "Updated this section in the editor.",
        },
      ]);
    } catch (runError) {
      const message =
        runError instanceof Error ? runError.message : "Agent request failed unexpectedly.";
      setError(message);
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: "assistant", text: message },
      ]);
    } finally {
      setRunning(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [blockTitle, getContent, getSelection, input, onApplyContent, running]);

  return (
    <div className={cn("border-t border-border", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[13px] font-medium text-violet-700 transition-colors hover:bg-violet-500/5 dark:text-violet-300"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4" />
          AI Agent
        </span>
        <span className="text-[12px] text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-muted/20 px-4 py-3">
          <div
            ref={listRef}
            className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-border bg-background/80 p-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                  message.role === "user"
                    ? "ml-6 bg-violet-600/15 text-foreground"
                    : "mr-4 bg-muted text-foreground/90",
                )}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void runAgent();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the agent to edit this section…"
              disabled={running}
              className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-[13px] outline-none ring-violet-500/20 focus:ring-2"
              onKeyDown={(event) => event.stopPropagation()}
            />
            <button
              type="submit"
              disabled={running || !input.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              aria-label="Run agent"
            >
              {running ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
              aria-label="Close agent panel"
            >
              <X className="size-4" />
            </button>
          </form>

          {error ? <p className="text-[12px] text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
