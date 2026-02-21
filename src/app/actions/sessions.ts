"use server";

import { db } from "@/lib/db";
import { writingSessions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/authorize";
import { eq, sql } from "drizzle-orm";

export async function startSession(documentId: string) {
  const user = await requireAuth();
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
  await requireAuth();
  const now = new Date();

  const [session] = await db
    .update(writingSessions)
    .set({
      lastHeartbeat: now,
      activeSeconds: sql`${writingSessions.activeSeconds} + 30`,
    })
    .where(eq(writingSessions.id, sessionId))
    .returning();

  return session;
}

export async function endSession(sessionId: string) {
  await requireAuth();

  await db
    .update(writingSessions)
    .set({
      endedAt: new Date(),
    })
    .where(eq(writingSessions.id, sessionId));
}
