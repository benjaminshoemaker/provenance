"use server";

import { db } from "@/lib/db";
import { pasteEvents, writingSessions } from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { and, eq } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LogPasteEventData {
  sourceId?: string;
  documentId: string;
  sessionId?: string;
  content: string;
  sourceType: string;
  characterCount: number;
}

export async function logPasteEvent(data: LogPasteEventData) {
  if (data.sourceId && !UUID_RE.test(data.sourceId)) {
    throw new Error("Invalid sourceId");
  }

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
      ...(data.sourceId ? { id: data.sourceId } : {}),
      documentId: data.documentId,
      sessionId: data.sessionId,
      content: data.content,
      sourceType: data.sourceType,
      characterCount: data.characterCount,
    })
    .returning();

  return event;
}
