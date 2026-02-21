"use client";

import { ReactNode, useEffect, useCallback, useRef } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useDefaultLayout, usePanelRef } from "react-resizable-panels";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { usePanelState } from "@/hooks/usePanelState";
import { ActivityBar, PANEL_ITEMS } from "./ActivityBar";

const LAYOUT_STORAGE_ID = "provenance-editor-layout";

interface PanelLayoutProps {
  editorContent: ReactNode;
  aiChatContent: ReactNode;
  freeformContent?: ReactNode;
}

export function PanelLayout({
  editorContent,
  aiChatContent,
  freeformContent,
}: PanelLayoutProps) {
  const { isPanelOpen, togglePanel, setPanelOpen } = usePanelState({
    defaults: { editor: true, "ai-chat": true },
  });

  const editorPanelRef = usePanelRef();
  const aiChatPanelRef = usePanelRef();

  // Track collapsed state to detect changes via onResize
  const editorCollapsedRef = useRef(false);
  const aiChatCollapsedRef = useRef(false);

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: LAYOUT_STORAGE_ID,
    storage: typeof window !== "undefined" ? localStorage : undefined,
    panelIds: ["editor", "ai-chat"],
  });

  // Refs for activity bar buttons (focus management)
  const activityBarButtonRefs = useRef<Map<string, HTMLButtonElement>>(
    new Map()
  );

  // Helper to get panel ref by id
  const getPanelRef = useCallback(
    (id: string): React.RefObject<PanelImperativeHandle | null> | null => {
      if (id === "editor") return editorPanelRef;
      if (id === "ai-chat") return aiChatPanelRef;
      return null;
    },
    [editorPanelRef, aiChatPanelRef]
  );

  // Sync React state → imperative panel API
  useEffect(() => {
    for (const item of PANEL_ITEMS) {
      const ref = getPanelRef(item.id);
      const panel = ref?.current;
      if (!panel) continue;

      const shouldBeOpen = isPanelOpen(item.id);
      const isCollapsed = panel.isCollapsed();

      if (shouldBeOpen && isCollapsed) {
        panel.expand();
      } else if (!shouldBeOpen && !isCollapsed) {
        panel.collapse();
      }
    }
  }, [isPanelOpen, getPanelRef]);

  // Handle resize to detect collapse/expand state changes
  const handleEditorResize = useCallback(
    (_size: PanelSize) => {
      const panel = editorPanelRef.current;
      if (!panel) return;
      const isCollapsed = panel.isCollapsed();
      if (isCollapsed !== editorCollapsedRef.current) {
        editorCollapsedRef.current = isCollapsed;
        setPanelOpen("editor", !isCollapsed);
      }
    },
    [editorPanelRef, setPanelOpen]
  );

  const handleAiChatResize = useCallback(
    (_size: PanelSize) => {
      const panel = aiChatPanelRef.current;
      if (!panel) return;
      const isCollapsed = panel.isCollapsed();
      if (isCollapsed !== aiChatCollapsedRef.current) {
        aiChatCollapsedRef.current = isCollapsed;
        setPanelOpen("ai-chat", !isCollapsed);
      }
    },
    [aiChatPanelRef, setPanelOpen]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;

      if (e.key === "!" || e.code === "Digit1") {
        e.preventDefault();
        togglePanel("editor");
      } else if (e.key === "@" || e.code === "Digit2") {
        e.preventDefault();
        togglePanel("ai-chat");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePanel]);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full">
      <ActivityBar isPanelOpen={isPanelOpen} onToggle={togglePanel} />
      <ResizablePanelGroup
        orientation="horizontal"
        onLayoutChanged={onLayoutChanged}
        defaultLayout={defaultLayout}
        id={LAYOUT_STORAGE_ID}
      >
        <ResizablePanel
          id="editor"
          panelRef={editorPanelRef}
          defaultSize="70%"
          minSize="30%"
          collapsible
          collapsedSize="0%"
          onResize={handleEditorResize}
        >
          <div
            id="panel-editor"
            className="h-full overflow-auto"
          >
            {editorContent}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          id="ai-chat"
          panelRef={aiChatPanelRef}
          defaultSize="30%"
          minSize="20%"
          collapsible
          collapsedSize="0%"
          onResize={handleAiChatResize}
        >
          <div
            id="panel-ai-chat"
            className="h-full overflow-auto"
          >
            {aiChatContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {freeformContent}
    </div>
  );
}
