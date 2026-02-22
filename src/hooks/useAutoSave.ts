"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { updateDocument } from "@/app/actions/documents";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  documentId: string;
  title: string;
  debounceMs?: number;
  maxRetries?: number;
}

function normalizeSerializableContent(
  content: Record<string, unknown>
): Record<string, unknown> {
  // TipTap can emit null-prototype objects in mark attrs.
  // Normalize to plain JSON objects before crossing the Server Action boundary.
  return JSON.parse(JSON.stringify(content)) as Record<string, unknown>;
}

function countWords(content: Record<string, unknown>): number {
  const extractText = (node: Record<string, unknown>): string => {
    if (node.type === "text" && typeof node.text === "string") {
      return node.text;
    }
    if (Array.isArray(node.content)) {
      return node.content.map((child) => extractText(child as Record<string, unknown>)).join(" ");
    }
    return "";
  };

  const text = extractText(content).trim();
  return text ? text.split(/\s+/).length : 0;
}

export function useAutoSave({
  documentId,
  title,
  debounceMs = 1000,
  maxRetries = 3,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const documentIdRef = useRef(documentId);
  const maxRetriesRef = useRef(maxRetries);
  const lastContentRef = useRef<Record<string, unknown> | null>(null);
  const prevTitleRef = useRef(title);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  const executeSave = useCallback(
    (content: Record<string, unknown>) => {
      const attemptSave = async (retriesLeft: number) => {
        setStatus("saving");
        try {
          await updateDocument(documentIdRef.current, {
            title: titleRef.current,
            content,
            wordCount: countWords(content),
          });
          setStatus("saved");
          setIsDirty(false);
        } catch {
          if (retriesLeft > 0) {
            const delay = Math.pow(2, maxRetriesRef.current - retriesLeft) * 1000;
            setTimeout(() => {
              attemptSave(retriesLeft - 1);
            }, delay);
          } else {
            setStatus("error");
          }
        }
      };

      attemptSave(maxRetriesRef.current);
    },
    []
  );

  const save = useCallback(
    (content: Record<string, unknown>) => {
      const normalizedContent = normalizeSerializableContent(content);
      lastContentRef.current = normalizedContent;
      setIsDirty(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        executeSave(normalizedContent);
      }, debounceMs);
    },
    [debounceMs, executeSave]
  );

  // Trigger a save when only the title changes
  useEffect(() => {
    if (prevTitleRef.current !== title) {
      prevTitleRef.current = title;
      if (lastContentRef.current) {
        save(lastContentRef.current);
      }
    }
  }, [title, save]);

  const retry = useCallback(() => {
    if (lastContentRef.current && status === "error") {
      save(lastContentRef.current);
    }
  }, [save, status]);

  // Flush pending save on page hide (tab switch, navigation, refresh).
  // visibilitychange fires reliably and browsers keep async requests alive briefly after it.
  useEffect(() => {
    const flushPendingSave = () => {
      if (timerRef.current && lastContentRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        executeSave(lastContentRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      flushPendingSave();
      if (isDirty) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, executeSave]);

  return { save, status, retry, isDirty };
}
