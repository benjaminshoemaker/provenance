"use server";

import { db } from "@/lib/db";
import { writingSessions } from "@/lib/db/schema";
import { requireAuth, requireDocumentOwner } from "@/lib/auth/authorize";
import { and, eq, sql } from "drizzle-orm";

export async function startSession(documentId: string) {
  const { user } = await requireDocumentOwner(documentId);
  const now = new Date();

  const [session] = await db
    .insert(writingSessions)
    .values({
      documentId,
      userId: user.id,
      startedAt: now,
      lastHeartbeat: now,
      activeSeconds: 0,
    })
    .returning();

  return session;
}

export async function heartbeat(sessionId: string) {
  const user = await requireAuth();
  const now = new Date();

  // Compute elapsed seconds from lastHeartbeat, clamped to [0, 60]
  const [session] = await db
    .update(writingSessions)
    .set({
      lastHeartbeat: now,
      activeSeconds: sql`${writingSessions.activeSeconds} + LEAST(GREATEST(EXTRACT(EPOCH FROM ${now}::timestamp - ${writingSessions.lastHeartbeat})::int, 0), 60)`,
    })
    .where(
      and(
        eq(writingSessions.id, sessionId),
        eq(writingSessions.userId, user.id)
      )
    )
    .returning();

  if (!session) {
    throw new Error("Not found");
  }

  return session;
}

export async function endSession(sessionId: string) {
  const user = await requireAuth();

  const [session] = await db
    .update(writingSessions)
    .set({
      endedAt: new Date(),
    })
    .where(
      and(
        eq(writingSessions.id, sessionId),
        eq(writingSessions.userId, user.id)
      )
    )
    .returning();

  if (!session) {
    throw new Error("Not found");
  }
}
