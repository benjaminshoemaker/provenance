import { db } from "@/lib/db";
import { badges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  calculateMetrics,
} from "@/lib/metrics";

export const revalidate = 86400; // 24h cache — badge data is immutable; takedown triggers on-demand revalidation
import { StatsSummary } from "@/components/verify/StatsSummary";
import { AuditTimeline } from "@/components/verify/AuditTimeline";
import { ScopeStatement } from "@/components/verify/ScopeStatement";
import { DocumentText } from "@/components/verify/DocumentText";

interface BadgeStats {
  typed_percentage?: number;
  human_typed_percentage?: number;
  ai_generated_percentage?: number;
  ai_tweaked_percentage?: number;
  pasted_external_percentage?: number;
  human_typed_words?: number;
  ai_generated_words?: number;
  ai_tweaked_words?: number;
  pasted_external_words?: number;
  total_words?: number;
  interaction_count: number;
  session_count: number;
  total_active_seconds: number;
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

interface ViewAuditTrail {
  interactions: AuditTrail["ai_interactions"];
  pasteEvents: AuditTrail["paste_events"];
  sessions: AuditTrail["writing_sessions"];
  revisions: AuditTrail["revisions"];
}

interface ViewStats {
  typed_percentage: number;
  human_typed_percentage: number;
  ai_generated_percentage: number;
  ai_tweaked_percentage: number;
  pasted_external_percentage: number;
  human_typed_words: number;
  ai_generated_words: number;
  ai_tweaked_words: number;
  pasted_external_words: number;
  total_words: number;
  interaction_count: number;
  session_count: number;
  total_active_seconds: number;
}

function getAuditTrail(rawAuditTrail: unknown): AuditTrail {
  return (rawAuditTrail as AuditTrail) ?? {
    ai_interactions: [],
    paste_events: [],
    writing_sessions: [],
    revisions: [],
  };
}

function resolveDisplayMetrics(params: {
  stats: BadgeStats;
  documentContent: Parameters<typeof calculateMetrics>[0];
}) {
  const { stats, documentContent } = params;
  const calculatedMetrics = calculateMetrics(documentContent);

  return {
    typedPercentage:
      stats.typed_percentage ??
      stats.human_typed_percentage ??
      calculatedMetrics.typedPercentage,
    humanTypedPercentage:
      stats.human_typed_percentage ?? calculatedMetrics.humanTypedPercentage,
    aiGeneratedPercentage:
      stats.ai_generated_percentage ?? calculatedMetrics.aiGeneratedPercentage,
    aiTweakedPercentage:
      stats.ai_tweaked_percentage ?? calculatedMetrics.aiTweakedPercentage,
    pastedExternalPercentage:
      stats.pasted_external_percentage ?? calculatedMetrics.pastedExternalPercentage,
    humanTypedWords: stats.human_typed_words ?? calculatedMetrics.humanTyped,
    aiGeneratedWords: stats.ai_generated_words ?? calculatedMetrics.aiGenerated,
    aiTweakedWords: stats.ai_tweaked_words ?? calculatedMetrics.aiTweaked,
    pastedExternalWords:
      stats.pasted_external_words ?? calculatedMetrics.pastedExternal,
    totalWords: stats.total_words ?? calculatedMetrics.totalWords,
  };
}

function TakedownNotice({ reason }: { reason: string | null }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-bold">Badge Removed</h1>
      <p className="text-muted-foreground">
        This badge has been taken down by the document owner.
        {reason && <span className="mt-2 block">Reason: {reason}</span>}
      </p>
    </div>
  );
}

function toViewStats(
  stats: BadgeStats,
  resolvedMetrics: ReturnType<typeof resolveDisplayMetrics>
): ViewStats {
  return {
    typed_percentage: resolvedMetrics.typedPercentage,
    human_typed_percentage: resolvedMetrics.humanTypedPercentage,
    ai_generated_percentage: resolvedMetrics.aiGeneratedPercentage,
    ai_tweaked_percentage: resolvedMetrics.aiTweakedPercentage,
    pasted_external_percentage: resolvedMetrics.pastedExternalPercentage,
    human_typed_words: resolvedMetrics.humanTypedWords,
    ai_generated_words: resolvedMetrics.aiGeneratedWords,
    ai_tweaked_words: resolvedMetrics.aiTweakedWords,
    pasted_external_words: resolvedMetrics.pastedExternalWords,
    total_words: resolvedMetrics.totalWords,
    interaction_count: stats.interaction_count ?? 0,
    session_count: stats.session_count ?? 0,
    total_active_seconds: stats.total_active_seconds ?? 0,
  };
}

function toViewAuditTrail(auditTrail: AuditTrail): ViewAuditTrail {
  return {
    interactions: auditTrail.ai_interactions ?? [],
    pasteEvents: auditTrail.paste_events ?? [],
    sessions: auditTrail.writing_sessions ?? [],
    revisions: auditTrail.revisions ?? [],
  };
}

function VerifyPageContent({
  id,
  documentTitle,
  documentText,
  stats,
  auditTrail,
}: {
  id: string;
  documentTitle: string;
  documentText: string;
  stats: ViewStats;
  auditTrail: ViewAuditTrail;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <nav className="sticky top-0 z-10 -mx-4 mb-4 border-b bg-background px-4 py-2 sm:hidden" aria-label="Site navigation">
        <Link href="/" className="flex items-center justify-center gap-2">
          <span className="text-base font-bold text-provenance-700">◆</span>
          <span className="text-xs font-medium text-provenance-700">Provenance</span>
          <span className="font-mono text-xs text-muted-foreground">{id.slice(0, 8)}...</span>
        </Link>
      </nav>

      <header className="mb-6 sm:mb-8 -mx-4 bg-gradient-to-b from-provenance-50/60 to-transparent px-4 pb-8 pt-6">
        <Link href="/" className="mb-2 flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-provenance-700">◆</span>
          <span className="text-sm font-medium text-provenance-700">Provenance</span>
        </Link>
        <h1 className="text-center text-xl font-bold tracking-tight sm:text-2xl">Verified Writing Process</h1>
        <p className="mt-1 text-center font-mono text-xs text-muted-foreground">
          {id}
        </p>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {documentTitle}
        </p>
      </header>

      <section className="mb-6 sm:mb-8">
        <StatsSummary stats={stats} />
      </section>

      <section className="mb-6 sm:mb-8">
        <ScopeStatement />
      </section>

      <section className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Document</h2>
        <DocumentText title={documentTitle} text={documentText} />
      </section>

      <section className="mb-6 sm:mb-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Audit Timeline</h2>
        <AuditTimeline
          interactions={auditTrail.interactions}
          pasteEvents={auditTrail.pasteEvents}
          sessions={auditTrail.sessions}
          revisions={auditTrail.revisions}
        />
      </section>

      <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
        Powered by{" "}
        <Link href="/" className="font-medium text-provenance-700 hover:underline">
          Provenance
        </Link>
        {" "}— Transparent AI writing verification
      </footer>
    </div>
  );
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

  if (badge.isTakenDown) {
    return <TakedownNotice reason={badge.takedownReason} />;
  }

  const stats = badge.stats as BadgeStats;
  const auditTrail = getAuditTrail(badge.auditTrail);
  const documentContent =
    badge.documentContent as Parameters<typeof calculateMetrics>[0];
  const resolvedMetrics = resolveDisplayMetrics({
    stats,
    documentContent,
  });
  const viewStats = toViewStats(stats, resolvedMetrics);
  const viewAuditTrail = toViewAuditTrail(auditTrail);

  return (
    <VerifyPageContent
      id={id}
      documentTitle={badge.documentTitle}
      documentText={badge.documentText}
      stats={viewStats}
      auditTrail={viewAuditTrail}
    />
  );
}
