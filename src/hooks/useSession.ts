"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  startSession,
  heartbeat,
  endSession,
} from "@/app/actions/sessions";

interface UseSessionOptions {
  documentId: string;
  heartbeatIntervalMs?: number;
  activityTimeoutMs?: number;
}

export function useSession({
  documentId,
  heartbeatIntervalMs = 30000,
  activityTimeoutMs = 60000,
}: UseSessionOptions) {
  const sessionIdRef = useRef<string | null>(null);
  const lastActivity = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markActive = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    let mounted = true;
    lastActivity.current = Date.now();

    async function init() {
      try {
        const session = await startSession(documentId);
        if (mounted && session) {
          sessionIdRef.current = session.id;
        }
      } catch {
        // Session start failed — continue without tracking
      }
    }

    init();

    // Set up heartbeat interval
    intervalRef.current = setInterval(async () => {
      const isActive =
        Date.now() - lastActivity.current < activityTimeoutMs;

      if (sessionIdRef.current && isActive) {
        try {
          await heartbeat(sessionIdRef.current);
        } catch {
          // Heartbeat failed — continue silently
        }
      }
    }, heartbeatIntervalMs);

    return () => {
      mounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // End session on unmount
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current).catch(() => {
          // End session failed — best effort
        });
      }
    };
  }, [documentId, heartbeatIntervalMs, activityTimeoutMs]);

  return { markActive };
}
