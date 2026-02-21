"use server";

import { db } from "@/lib/db";
import { pasteEvents } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/authorize";

interface LogPasteEventData {
  documentId: string;
  sessionId?: string;
  content: string;
  sourceType: string;
  characterCount: number;
}

export async function logPasteEvent(data: LogPasteEventData) {
  await requireAuth();

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
