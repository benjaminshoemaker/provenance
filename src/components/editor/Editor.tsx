"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { OriginMark } from "@/extensions/origin-mark";
import { PasteHandler } from "@/extensions/paste-handler";
import {
  SelectionHighlight,
  selectionHighlightKey,
} from "@/extensions/selection-highlight";
import { logPasteEvent } from "@/app/actions/paste-events";
import { useRevisions } from "@/hooks/useRevisions";
import { Toolbar } from "./Toolbar";
import { InlineAI } from "./InlineAI";
import { TimelineModal } from "./TimelineModal";
import { ChatPanel } from "./chat/ChatPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { Sparkles } from "lucide-react";

interface ThreadSummary {
  id: string;
  title: string;
  messageCount: number | null;
  updatedAt: Date | null;
}

interface EditorProps {
  content: Record<string, unknown>;
  documentId: string;
  title: string;
  provider?: string;
  model?: string;
  chatOpen?: boolean;
  onChatToggle?: () => void;
  initialChatThreads?: ThreadSummary[];
  onUpdate?: (json: Record<string, unknown>) => void;
}

interface TextSelection {
  text: string;
  from: number;
  to: number;
}

interface TriggerPosition {
  top: number;
  left: number;
  right: number;
}

export function Editor({
  content,
  documentId,
  onUpdate,
  provider = "anthropic",
  model,
  chatOpen = true,
  onChatToggle,
  initialChatThreads = [],
}: EditorProps) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showInlineAI, setShowInlineAI] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState<TriggerPosition>({
    top: 96,
    left: 0,
    right: 24,
  });
  const { updateContent, createAIRevision } = useRevisions({ documentId });
  const mainRef = useRef<HTMLElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const proseAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<Record<string, unknown>>(content);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);

  const getDocumentContent = useCallback(() => contentRef.current, []);
  const handleLensToggle = useCallback(() => setShowLens((v) => !v), []);

  const handleExternalPaste = useCallback(
    (pastedContent: string, characterCount: number) => {
      logPasteEvent({
        documentId,
        content: pastedContent,
        sourceType: "external",
        characterCount,
      });
    },
    [documentId]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      OriginMark,
      SelectionHighlight,
      PasteHandler.configure({
        documentId,
        onExternalPaste: handleExternalPaste,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      contentRef.current = json;
      onUpdate?.(json);
      updateContent(json);
    },
  });

  const updateTriggerPosition = useCallback(
    (position?: number) => {
      if (!editor || !mainRef.current) return;

      const main = mainRef.current;
      const proseArea = proseAreaRef.current;
      const mainRect = main.getBoundingClientRect();
      const proseRect = proseArea?.getBoundingClientRect();

      const iconSize = 32;
      const fallbackWidth = main.clientWidth || 1200;
      const fallbackHeight = main.clientHeight || 800;
      const targetPos = Math.max(1, position ?? editor.state.selection.from);

      try {
        const cursorCoords = editor.view.coordsAtPos(targetPos);
        const minTop = 56;
        const maxTop = Math.max(minTop, fallbackHeight - iconSize - 8);
        const nextTop = Math.min(
          maxTop,
          Math.max(minTop, cursorCoords.top - mainRect.top - 4)
        );

        const rightMarginAnchor = proseRect?.right
          ? proseRect.right - mainRect.left + 8
          : fallbackWidth - iconSize - 12;
        const nextLeft = Math.min(
          fallbackWidth - iconSize - 8,
          Math.max(8, rightMarginAnchor)
        );

        setTriggerPosition({
          top: nextTop,
          left: nextLeft,
          right: Math.max(8, fallbackWidth - nextLeft - iconSize),
        });
      } catch {
        // Ignore transient invalid positions from TipTap while selection is updating.
      }
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) return;
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      updateTriggerPosition(to);
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to);
        setSelection({ text, from, to });
      } else {
        setSelection(null);
      }
    };

    handleSelectionUpdate();
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleSelectionUpdate);
    };
  }, [editor, updateTriggerPosition]);

  useEffect(() => {
    if (!editor) return;
    const handleViewportChange = () => updateTriggerPosition();
    const scrollArea = scrollAreaRef.current;
    window.addEventListener("resize", handleViewportChange);
    scrollArea?.addEventListener("scroll", handleViewportChange, {
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      scrollArea?.removeEventListener("scroll", handleViewportChange);
    };
  }, [editor, updateTriggerPosition]);

  // Dynamically toggle lens-off class on the ProseMirror editor root
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    if (showLens) {
      el.classList.remove("lens-off");
    } else {
      el.classList.add("lens-off");
    }
  }, [editor, showLens]);

  // Cmd+Shift+H keyboard shortcut for lens toggle, scoped to editor container
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "KeyH" &&
        e.shiftKey &&
        (e.metaKey || e.ctrlKey) &&
        proseAreaRef.current?.contains(document.activeElement)
      ) {
        e.preventDefault();
        setShowLens((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!selection) {
      setShowInlineAI(false);
    }
  }, [selection]);

  // Sync persistent selection highlight decoration with InlineAI visibility
  useEffect(() => {
    if (!editor?.view || !editor.state?.tr) return;
    try {
      if (showInlineAI && selection) {
        editor.view.dispatch(
          editor.state.tr.setMeta(selectionHighlightKey, {
            from: selection.from,
            to: selection.to,
            active: true,
          })
        );
      } else {
        editor.view.dispatch(
          editor.state.tr.setMeta(selectionHighlightKey, {
            from: 0,
            to: 0,
            active: false,
          })
        );
      }
    } catch {
      // Editor not fully initialized yet
    }
  }, [editor, showInlineAI, selection]);

  const handleDismissInlineAI = useCallback(() => {
    setShowInlineAI(false);
  }, []);

  const handleAITriggerClick = useCallback(() => {
    if (!selection?.text.trim()) return;
    editor
      ?.chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .run();
    setShowInlineAI(true);
  }, [editor, selection]);

  // Sync chatOpen prop with imperative panel handle
  useEffect(() => {
    const panel = chatPanelRef.current;
    if (!panel) return;
    if (chatOpen) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [chatOpen]);

  // ⌘L keyboard shortcut to toggle AI chat panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        onChatToggle?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChatToggle]);

  const handleAIResponse = useCallback(
    (responseText: string) => {
      if (!editor) return;
      if (!responseText.trim()) return;
      editor.commands.addRecentAIResponse?.(responseText);
      void createAIRevision();
    },
    [editor, createAIRevision]
  );

  return (
    <>
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 w-full flex-1 rounded-lg border"
      >
        <ResizablePanel defaultSize={65} minSize={40}>
          <main
            ref={mainRef}
            className="relative flex h-full w-full flex-col"
            role="main"
          >
            <div className="border-b">
              <Toolbar
                editor={editor}
                onHistoryClick={() => setShowTimeline(true)}
                showLens={showLens}
                onLensToggle={handleLensToggle}
                chatOpen={chatOpen}
                onChatToggle={onChatToggle}
              />
            </div>
            <div
              ref={scrollAreaRef}
              className="flex-1 cursor-text overflow-auto"
              onClick={(e) => {
                // Click anywhere in scroll area focuses the editor
                if (e.target === scrollAreaRef.current || e.target === proseAreaRef.current) {
                  editor?.chain().focus("end").run();
                }
              }}
            >
              <div ref={proseAreaRef} className="mx-auto max-w-4xl px-8 py-8">
                <EditorContent
                  editor={editor}
                  className="prose prose-neutral dark:prose-invert max-w-none focus-within:outline-none [&_.tiptap]:min-h-[60vh] [&_.tiptap]:outline-none"
                />
              </div>
            </div>

            {selection?.text.trim() && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
                onClick={handleAITriggerClick}
                className="absolute z-40 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-violet-200 bg-background text-violet-600 shadow-sm transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-provenance-500"
                style={{
                  top: `${triggerPosition.top}px`,
                  left: `${triggerPosition.left}px`,
                }}
                aria-label="Modify selected text with AI"
                title="Modify selected text"
                data-testid="inline-ai-trigger"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            )}
          </main>
        </ResizablePanel>

        <ResizableHandle
          withHandle={chatOpen !== false}
          className={chatOpen === false ? "w-0 opacity-0" : ""}
        />

        <ResizablePanel
          panelRef={chatPanelRef}
          defaultSize={35}
          minSize={25}
          collapsible
          collapsedSize={0}
          onResize={() => updateTriggerPosition()}
        >
          {chatOpen !== false && (
            <ChatPanel
              documentId={documentId}
              provider={provider}
              model={model}
              getDocumentContent={getDocumentContent}
              initialThreads={initialChatThreads}
              onClose={() => onChatToggle?.()}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Modals render outside the panel group so they overlay correctly */}
      {showInlineAI && selection && editor && (
        <InlineAI
          editor={editor}
          documentId={documentId}
          provider={provider}
          model={model}
          selectedText={selection.text}
          selectionFrom={selection.from}
          selectionTo={selection.to}
          anchorTop={triggerPosition.top}
          anchorRight={triggerPosition.right}
          onDismiss={handleDismissInlineAI}
          onAIResponse={handleAIResponse}
        />
      )}
      <TimelineModal
        documentId={documentId}
        isOpen={showTimeline}
        onClose={() => setShowTimeline(false)}
      />
    </>
  );
}
