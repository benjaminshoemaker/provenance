"use server";

import { db } from "@/lib/db";
import { pasteEvents, writingSessions } from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { and, eq } from "drizzle-orm";

interface LogPasteEventData {
  documentId: string;
  sessionId?: string;
  content: string;
  sourceType: string;
  characterCount: number;
}

export async function logPasteEvent(data: LogPasteEventData) {
  const { user } = await requireDocumentOwner(data.documentId);

  if (data.sessionId) {
    const [session] = await db
      .select({ id: writingSessions.id })
      .from(writingSessions)
      .where(
        and(
          eq(writingSessions.id, data.sessionId),
          eq(writingSessions.userId, user.id),
          eq(writingSessions.documentId, data.documentId)
        )
      );

    if (!session) {
      throw new Error("Not found");
    }
  }

  const [event] = await db
    .insert(pasteEvents)
    .values({
      documentId: data.documentId,
      sessionId: data.sessionId,
      content: data.content,
      sourceType: data.sourceType,
      characterCount: data.characterCount,
    })
    .returning();

  return event;
}
