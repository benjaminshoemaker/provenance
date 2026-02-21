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
  debounceMs = 2000,
  maxRetries = 3,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const documentIdRef = useRef(documentId);
  const maxRetriesRef = useRef(maxRetries);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    documentIdRef.current = documentId;
  }, [documentId]);

  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  const save = useCallback(
    (content: Record<string, unknown>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        const attemptSave = async (retriesLeft: number) => {
          setStatus("saving");
          try {
            await updateDocument(documentIdRef.current, {
              title: titleRef.current,
              content,
              wordCount: countWords(content),
            });
            setStatus("saved");
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
      }, debounceMs);
    },
    [debounceMs]
  );

  return { save, status };
}
