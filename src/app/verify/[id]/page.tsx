import { db } from "@/lib/db";
import { badges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { StatsSummary } from "@/components/verify/StatsSummary";
import { AuditTimeline } from "@/components/verify/AuditTimeline";
import { ScopeStatement } from "@/components/verify/ScopeStatement";
import { DocumentText } from "@/components/verify/DocumentText";

interface BadgeStats {
  ai_percentage: number;
  aiPercentage?: number;
  external_paste_percentage: number;
  interaction_count: number;
  session_count: number;
  total_active_seconds: number;
  total_characters: number;
}

interface AuditTrail {
  ai_interactions: Array<{
    mode: string;
    prompt: string;
    response: string;
    action: string;
    createdAt: string | Date | null;
  }>;
  paste_events: Array<{
    sourceType: string;
    characterCount: number;
    createdAt: string | Date | null;
  }>;
  writing_sessions: Array<{
    startedAt: string | Date | null;
    endedAt: string | Date | null;
    activeSeconds: number | null;
  }>;
  revisions: Array<{
    trigger: string;
    createdAt: string | Date | null;
  }>;
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.verificationId, id));

  if (!badge) {
    notFound();
  }

  // Handle taken-down badges
  if (badge.isTakenDown) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Badge Removed</h1>
        <p className="text-muted-foreground">
          This badge has been taken down by the document owner.
          {badge.takedownReason && (
            <span className="mt-2 block">
              Reason: {badge.takedownReason}
            </span>
          )}
        </p>
      </div>
    );
  }

  const stats = badge.stats as BadgeStats;
  const auditTrail = badge.auditTrail as AuditTrail;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-6 text-center sm:mb-8">
        <div className="mb-2 text-sm font-medium text-primary">
          ◆ Provenance
        </div>
        <h1 className="text-xl font-bold sm:text-2xl">Verified Writing Process</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {badge.documentTitle}
        </p>
      </header>

      <section className="mb-6 sm:mb-8">
        <StatsSummary
          stats={{
            ai_percentage: stats.ai_percentage ?? stats.aiPercentage ?? 0,
            external_paste_percentage: stats.external_paste_percentage ?? 0,
            interaction_count: stats.interaction_count ?? 0,
            session_count: stats.session_count ?? 0,
            total_active_seconds: stats.total_active_seconds ?? 0,
            total_characters: stats.total_characters ?? 0,
          }}
        />
      </section>

      <section className="mb-6 sm:mb-8">
        {/* Scope certification and methodology */}
        <ScopeStatement />
      </section>

      <section className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-lg font-semibold">Document</h2>
        <DocumentText
          title={badge.documentTitle}
          text={badge.documentText}
        />
      </section>

      <section className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-lg font-semibold">Audit Timeline</h2>
        <AuditTimeline
          interactions={auditTrail.ai_interactions ?? []}
          pasteEvents={auditTrail.paste_events ?? []}
          sessions={auditTrail.writing_sessions ?? []}
          revisions={auditTrail.revisions ?? []}
        />
      </section>

      <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
        Powered by Provenance — Transparent AI writing verification
      </footer>
    </div>
  );
}
