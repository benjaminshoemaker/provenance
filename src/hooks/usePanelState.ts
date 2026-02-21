"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "provenance-panel-state";

interface PanelStateOptions {
  defaults: Record<string, boolean>;
}

export function usePanelState({ defaults }: PanelStateOptions) {
  const [panels, setPanels] = useState<Record<string, boolean>>(defaults);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage after mount (client-only)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          // Merge with defaults — only use stored values for known keys
          setPanels((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(merged)) {
              if (typeof parsed[key] === "boolean") {
                merged[key] = parsed[key];
              }
            }
            return merged;
          });
        }
      }
    } catch {
      // Corrupted data — keep defaults
    }
  }, []);

  // Persist to localStorage on change (skip initial render)
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
    } catch {
      // Storage full or unavailable
    }
  }, [panels]);

  const togglePanel = useCallback((id: string) => {
    setPanels((prev) => {
      if (!(id in prev)) return prev;
      return { ...prev, [id]: !prev[id] };
    });
  }, []);

  const isPanelOpen = useCallback(
    (id: string) => panels[id] ?? false,
    [panels]
  );

  const setPanelOpen = useCallback((id: string, open: boolean) => {
    setPanels((prev) => {
      if (!(id in prev) || prev[id] === open) return prev;
      return { ...prev, [id]: open };
    });
  }, []);

  return { panels, togglePanel, isPanelOpen, setPanelOpen };
}
