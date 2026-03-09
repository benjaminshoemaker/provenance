"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";

interface BadgeHistoryModalProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BadgeHistoryItem {
  id: string;
  verificationId: string;
  stats?: {
    typed_percentage?: number;
    human_typed_percentage?: number;
    ai_generated_percentage?: number;
    ai_tweaked_percentage?: number;
    pasted_external_percentage?: number;
  };
  createdAt: string | Date | null;
}

function formatBadgeDate(value: string | Date | null) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getBreakdown(stats?: BadgeHistoryItem["stats"]) {
  const typed = clampPercentage(
    stats?.typed_percentage ?? stats?.human_typed_percentage ?? 0
  );
  const aiGenerated = clampPercentage(stats?.ai_generated_percentage ?? 0);
  const aiTweaked = clampPercentage(stats?.ai_tweaked_percentage ?? 0);
  const pasted = clampPercentage(stats?.pasted_external_percentage ?? 0);
  const sum = typed + aiGenerated + aiTweaked + pasted;
  if (sum <= 100) {
    return { typed, aiGenerated, aiTweaked, pasted };
  }
  const normalized = Math.max(sum, 1);
  return {
    typed: clampPercentage((typed / normalized) * 100),
    aiGenerated: clampPercentage((aiGenerated / normalized) * 100),
    aiTweaked: clampPercentage((aiTweaked / normalized) * 100),
    pasted: clampPercentage((pasted / normalized) * 100),
  };
}

function BadgeSparklinePreview({ stats }: { stats?: BadgeHistoryItem["stats"] }) {
  const { typed, aiGenerated, aiTweaked, pasted } = getBreakdown(stats);

  return (
    <div className="mt-2 w-full max-w-[360px] rounded-md bg-muted/40 p-2">
      <div className="mb-1 text-[11px]">
        <span className="font-semibold tabular-nums text-foreground">{typed}%</span>
        <span className="ml-1 text-muted-foreground">typed</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        {typed > 0 && (
          <div
            className="bg-gray-700"
            style={{ width: `${typed}%` }}
            aria-label={`${typed}% typed`}
          />
        )}
        {aiGenerated > 0 && (
          <div
            className="bg-sky-500"
            style={{ width: `${aiGenerated}%` }}
            aria-label={`${aiGenerated}% ai-generated`}
          />
        )}
        {aiTweaked > 0 && (
          <div
            className="bg-teal-500"
            style={{ width: `${aiTweaked}%` }}
            aria-label={`${aiTweaked}% ai-tweaked`}
          />
        )}
        {pasted > 0 && (
          <div
            className="bg-orange-500"
            style={{ width: `${pasted}%` }}
            aria-label={`${pasted}% pasted`}
          />
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-700" />
          Typed {typed}%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
          AI gen {aiGenerated}%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-teal-500" />
          AI tweaked {aiTweaked}%
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          Pasted {pasted}%
        </span>
      </div>
    </div>
  );
}

export function BadgeHistoryModal({
  documentId,
  isOpen,
  onClose,
}: BadgeHistoryModalProps) {
  const [badges, setBadges] = useState<BadgeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/badges?documentId=${documentId}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: BadgeHistoryItem[]) => {
        if (!cancelled) setBadges(data);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, documentId]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const hasBadges = useMemo(() => badges.length > 0, [badges]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Badge history"
      data-testid="badge-history-modal"
    >
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border bg-background p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Badge History</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Close badge history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading badges...
          </p>
        )}

        {!loading && !hasBadges && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No badges found.
          </p>
        )}

        {!loading && hasBadges && (
          <div className="space-y-2">
            {badges.map((badge, index) => (
              <div
                key={badge.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/verify/${badge.verificationId}`}
                    className="truncate text-sm font-medium text-provenance-700 hover:underline"
                  >
                    {badge.verificationId}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatBadgeDate(badge.createdAt)}</span>
                    <span>
                      · {badge.stats?.typed_percentage ?? badge.stats?.human_typed_percentage ?? 0}% typed
                    </span>
                    {index === 0 && (
                      <span className="rounded bg-provenance-50 px-1.5 py-0.5 text-provenance-700">
                        Latest
                      </span>
                    )}
                  </div>
                  <BadgeSparklinePreview stats={badge.stats} />
                </div>
                <Link
                  href={`/verify/${badge.verificationId}`}
                  className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
