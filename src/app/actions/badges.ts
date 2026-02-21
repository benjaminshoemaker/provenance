"use server";

import { db } from "@/lib/db";
import {
  badges,
  aiInteractions,
  pasteEvents,
  writingSessions,
  revisions,
} from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { calculateMetrics } from "@/lib/metrics";
import { extractPlainText } from "@/lib/tiptap-utils";
import { generateBadgeHtml, generateBadgeMarkdown } from "@/lib/badge-snippets";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function generateBadge(documentId: string) {
  const { document } = await requireDocumentOwner(documentId);

  // Fetch audit trail data
  const [interactions, pastes, sessions, documentRevisions] = await Promise.all([
    db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.documentId, documentId)),
    db
      .select()
      .from(pasteEvents)
      .where(eq(pasteEvents.documentId, documentId)),
    db
      .select()
      .from(writingSessions)
      .where(eq(writingSessions.documentId, documentId)),
    db
      .select()
      .from(revisions)
      .where(eq(revisions.documentId, documentId)),
  ]);

  // Extract plain text and calculate metrics
  const content = document.content as Parameters<typeof extractPlainText>[0];
  const documentText = extractPlainText(content);
  const metrics = calculateMetrics(content);

  // Calculate stats
  const totalActiveSeconds = sessions.reduce(
    (sum, s) => sum + (s.activeSeconds ?? 0),
    0
  );

  const stats = {
    ai_percentage: metrics.ai_percentage,
    external_paste_percentage: metrics.external_paste_percentage,
    interaction_count: interactions.length,
    session_count: sessions.length,
    total_active_seconds: totalActiveSeconds,
    total_characters: metrics.total_characters,
  };

  // Generate verification ID
  const verificationId = nanoid(21);

  // Freeze the audit trail
  const auditTrail = {
    ai_interactions: interactions.map((i) => ({
      mode: i.mode,
      prompt: i.prompt,
      selectedText: i.selectedText,
      response: i.response,
      action: i.action,
      provider: i.provider,
      model: i.model,
      createdAt: i.createdAt,
    })),
    paste_events: pastes.map((p) => ({
      sourceType: p.sourceType,
      characterCount: p.characterCount,
      createdAt: p.createdAt,
    })),
    writing_sessions: sessions.map((s) => ({
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      activeSeconds: s.activeSeconds,
    })),
    revisions: documentRevisions.map((r) => ({
      trigger: r.trigger,
      createdAt: r.createdAt,
    })),
  };

  // Insert badge record (insert-only, no update or delete)
  const [badge] = await db
    .insert(badges)
    .values({
      documentId,
      verificationId,
      documentTitle: document.title,
      documentText,
      documentContent: document.content,
      auditTrail,
      stats,
    })
    .returning();

  // Generate embed snippets
  const badgeHtml = generateBadgeHtml(verificationId, metrics.ai_percentage);
  const badgeMarkdown = generateBadgeMarkdown(
    verificationId,
    metrics.ai_percentage
  );

  return {
    ...badge,
    badgeHtml,
    badgeMarkdown,
  };
}

export async function takedownBadge(badgeId: string, reason?: string) {
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.id, badgeId));

  if (!badge) throw new Error("Badge not found");

  // Verify ownership through document
  await requireDocumentOwner(badge.documentId);

  await db
    .update(badges)
    .set({
      isTakenDown: true,
      takedownReason: reason ?? null,
    })
    .where(eq(badges.id, badgeId));

  // Trigger on-demand revalidation for the verification page and badge image
  revalidatePath(`/verify/${badge.verificationId}`);
  revalidatePath(`/api/badges/${badge.verificationId}/image`);
}
