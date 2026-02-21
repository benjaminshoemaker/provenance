"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  generateBadgeHtml,
  generateBadgeMarkdown,
} from "@/lib/badge-snippets";

interface Badge {
  id: string;
  verificationId: string;
  stats: {
    ai_percentage: number;
  };
  createdAt: string | Date | null;
}

interface BadgeListProps {
  documentId: string;
}

export function BadgeList({ documentId }: BadgeListProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    try {
      const res = await fetch(`/api/badges?documentId=${documentId}`);
      if (res.ok) {
        const data = await res.json();
        setBadges(data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const copySnippet = async (verificationId: string, aiPercentage: number, type: "html" | "md") => {
    const snippet =
      type === "html"
        ? generateBadgeHtml(verificationId, aiPercentage)
        : generateBadgeMarkdown(verificationId, aiPercentage);

    await navigator.clipboard.writeText(snippet);
    setCopiedId(`${verificationId}-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading badges...</div>;
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Badges ({badges.length})</h3>
      {badges.map((badge) => (
        <div
          key={badge.id}
          className="flex items-center justify-between rounded-lg border p-3 text-sm"
        >
          <div>
            <a
              href={`/verify/${badge.verificationId}`}
              className="font-medium text-primary hover:underline"
            >
              {badge.verificationId.slice(0, 8)}...
            </a>
            <span className="ml-2 text-xs text-muted-foreground">
              {badge.stats?.ai_percentage ?? 0}% AI
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copySnippet(badge.verificationId, badge.stats?.ai_percentage ?? 0, "html")}
            >
              {copiedId === `${badge.verificationId}-html`
                ? "Copied!"
                : "HTML"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copySnippet(badge.verificationId, badge.stats?.ai_percentage ?? 0, "md")}
            >
              {copiedId === `${badge.verificationId}-md`
                ? "Copied!"
                : "MD"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
