"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AuditTimeline } from "@/components/verify/AuditTimeline";
import { X } from "lucide-react";

interface TimelineModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TimelineData {
  interactions: Array<{
    mode: string;
    prompt: string;
    response: string;
    action: string;
    createdAt: string | Date | null;
  }>;
  pasteEvents: Array<{
    sourceType: string;
    characterCount: number;
    createdAt: string | Date | null;
  }>;
  sessions: Array<{
    startedAt: string | Date | null;
    endedAt: string | Date | null;
    activeSeconds: number | null;
  }>;
  revisions: Array<{
    trigger: string;
    createdAt: string | Date | null;
  }>;
}

export function TimelineModal({ documentId, isOpen, onClose }: TimelineModalProps) {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    fetch(`/api/documents/${documentId}/timeline`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, documentId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + auto-focus close button on open
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    dialog.addEventListener("keydown", trapFocus);
    return () => dialog.removeEventListener("keydown", trapFocus);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="timeline-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Document History"
      ref={dialogRef}
    >
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" id="timeline-modal-title">Document History</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading timeline...
          </p>
        )}

        {!loading && data && (
          <AuditTimeline
            interactions={data.interactions}
            pasteEvents={data.pasteEvents}
            sessions={data.sessions}
            revisions={data.revisions}
            showBadgeLandmark={false}
          />
        )}

        {!loading && !data && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Failed to load timeline.
          </p>
        )}
      </div>
    </div>
  );
}
