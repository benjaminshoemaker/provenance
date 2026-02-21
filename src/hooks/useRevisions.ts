"use client";

import { useEffect, useRef, useCallback } from "react";
import { createRevision } from "@/app/actions/revisions";

interface UseRevisionsOptions {
  documentId: string;
  intervalMs?: number;
  activityTimeoutMs?: number;
}

export function useRevisions({
  documentId,
  intervalMs = 30000,
  activityTimeoutMs = 60000,
}: UseRevisionsOptions) {
  const contentRef = useRef<Record<string, unknown> | null>(null);
  const lastActivity = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateContent = useCallback(
    (content: Record<string, unknown>) => {
      contentRef.current = content;
      lastActivity.current = Date.now();
    },
    []
  );

  const createAIRevision = useCallback(async () => {
    if (!contentRef.current) return;

    try {
      await createRevision({
        documentId,
        content: contentRef.current,
        trigger: "ai_interaction",
      });
    } catch {
      // Best effort — don't break AI workflow
    }
  }, [documentId]);

  useEffect(() => {
    // Set up interval-based revision creation every 30 seconds
    intervalRef.current = setInterval(async () => {
      const isActive =
        Date.now() - lastActivity.current < activityTimeoutMs;

      if (contentRef.current && isActive) {
        try {
          await createRevision({
            documentId,
            content: contentRef.current,
            trigger: "interval",
          });
        } catch {
          // Revision failed — continue silently
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [documentId, intervalMs, activityTimeoutMs]);

  return { updateContent, createAIRevision };
}
