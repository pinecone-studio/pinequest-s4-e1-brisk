"use client";

import { TddAgentChat } from "@/components/onboarding/tiptap/TddAgentChat";
import "@/components/onboarding/tiptap/tiptap-tdd-editor.css";
import {
  TIPTAP_COLLAB_WS_URL,
  tiptapDocumentName,
} from "@/lib/tiptap/constants";
import {
  buildTddEditorExtensions,
  getEditorMarkdown,
} from "@/lib/tiptap/tdd-editor-extensions";
import type { TddBlock } from "@/lib/onboarding/tdd-types";
import { cn } from "@/lib/utils";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Doc } from "yjs";
import * as Y from "yjs";

type CollabState =
  | { status: "loading" }
  | { status: "local" }
  | {
      status: "collab";
      ydoc: Doc;
      provider: HocuspocusProvider;
    };

type TddTiptapAgentEditorProps = {
  block: TddBlock;
  sessionKey: string;
  onContentChange: (content: string) => void;
};

function useTddCollab(sessionKey: string, blockId: string) {
  const [collabState, setCollabState] = useState<CollabState>({ status: "loading" });
  const documentName = tiptapDocumentName(sessionKey, blockId);

  useEffect(() => {
    let cancelled = false;
    let provider: HocuspocusProvider | null = null;
    let ydoc: Doc | null = null;

    async function connect() {
      try {
        const tokenResponse = await fetch("/api/tiptap/collab-token");
        if (!tokenResponse.ok) {
          if (!cancelled) {
            setCollabState({ status: "local" });
          }
          return;
        }

        const token = await tokenResponse.text();
        ydoc = new Y.Doc();
        provider = new HocuspocusProvider({
          url: TIPTAP_COLLAB_WS_URL,
          name: documentName,
          document: ydoc,
          token,
        });

        if (!cancelled) {
          setCollabState({ status: "collab", ydoc, provider });
        }
      } catch {
        if (!cancelled) {
          setCollabState({ status: "local" });
        }
      }
    }

    void connect();

    return () => {
      cancelled = true;
      provider?.destroy();
      ydoc?.destroy();
    };
  }, [documentName]);

  return collabState;
}

function TddTiptapEditorSurface({
  block,
  collabState,
  onContentChange,
}: {
  block: TddBlock;
  collabState: Extract<CollabState, { status: "local" | "collab" }>;
  onContentChange: (content: string) => void;
}) {
  const initialContentLoadedRef = useRef(false);
  const syncingFromParentRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildTddEditorExtensions({
      placeholder: "Click to edit this section…",
      ydoc: collabState.status === "collab" ? collabState.ydoc : null,
      collabProvider: collabState.status === "collab" ? collabState.provider : null,
    }),
    editorProps: {
      attributes: {
        class: "ProseMirror focus:outline-none",
        "aria-label": `Edit ${block.title}`,
      },
      handleDOMEvents: {
        mousedown: (_view, event) => {
          event.stopPropagation();
          return false;
        },
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      if (syncingFromParentRef.current) {
        return;
      }
      onContentChange(getEditorMarkdown(activeEditor));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (collabState.status === "collab") {
      const loadInitialContent = () => {
        if (initialContentLoadedRef.current || !block.content.trim()) {
          initialContentLoadedRef.current = true;
          return;
        }

        const config = collabState.ydoc.getMap("config");
        if (config.get("initialContentLoaded")) {
          initialContentLoadedRef.current = true;
          return;
        }

        config.set("initialContentLoaded", true);
        syncingFromParentRef.current = true;
        editor.commands.setContent(block.content);
        syncingFromParentRef.current = false;
        initialContentLoadedRef.current = true;
        onContentChange(getEditorMarkdown(editor));
      };

      collabState.provider.on("synced", loadInitialContent);
      if (collabState.provider.synced) {
        loadInitialContent();
      }

      return () => {
        collabState.provider.off("synced", loadInitialContent);
      };
    }

    if (!editor.getText().trim() && block.content.trim()) {
      syncingFromParentRef.current = true;
      editor.commands.setContent(block.content);
      syncingFromParentRef.current = false;
    }
  }, [block.content, collabState, editor, onContentChange]);

  useEffect(() => {
    if (!editor || collabState.status === "collab") {
      return;
    }

    const currentMarkdown = getEditorMarkdown(editor);
    if (currentMarkdown === block.content.trim()) {
      return;
    }

    syncingFromParentRef.current = true;
    editor.commands.setContent(block.content);
    syncingFromParentRef.current = false;
  }, [block.content, collabState.status, editor]);

  const getContent = useCallback(() => {
    if (!editor) {
      return block.content;
    }
    return getEditorMarkdown(editor);
  }, [block.content, editor]);

  const getSelection = useCallback(() => {
    if (!editor) {
      return "";
    }
    const { from, to } = editor.state.selection;
    if (from === to) {
      return "";
    }
    return editor.state.doc.textBetween(from, to, "\n").trim();
  }, [editor]);

  const applyAgentContent = useCallback(
    (content: string) => {
      if (!editor) {
        onContentChange(content);
        return;
      }
      syncingFromParentRef.current = true;
      editor.commands.setContent(content);
      syncingFromParentRef.current = false;
      onContentChange(getEditorMarkdown(editor));
    },
    [editor, onContentChange],
  );

  if (!editor) {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4 py-8 text-sm text-muted-foreground">
        Loading TipTap editor…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 px-4 py-4">
        <EditorContent
          editor={editor}
          className={cn(
            "tiptap-tdd-editor rounded-lg",
            collabState.status === "collab" && "ring-1 ring-violet-500/20",
          )}
        />
      </div>
      <TddAgentChat
        blockTitle={block.title}
        getContent={getContent}
        getSelection={getSelection}
        onApplyContent={applyAgentContent}
      />
    </div>
  );
}

export function TddTiptapAgentEditor({
  block,
  sessionKey,
  onContentChange,
}: TddTiptapAgentEditorProps) {
  const collabState = useTddCollab(sessionKey, block.id);

  if (collabState.status === "loading") {
    return (
      <div className="flex min-h-[320px] items-center justify-center px-4 py-8 text-sm text-muted-foreground">
        Connecting TipTap editor…
      </div>
    );
  }

  return (
    <TddTiptapEditorSurface
      key={`${collabState.status}-${block.id}`}
      block={block}
      collabState={collabState}
      onContentChange={onContentChange}
    />
  );
}
