"use server";

import { db } from "@/lib/db";
import { pasteEvents } from "@/lib/db/schema";
import { validateSessionOwnership } from "@/lib/actions/validate-session-ownership";

interface LogPasteEventData {
  sourceId?: string;
  documentId: string;
  sessionId?: string;
  content: string;
  sourceType: string;
  characterCount: number;
}

export async function logPasteEvent(data: LogPasteEventData) {
  await validateSessionOwnership({
    documentId: data.documentId,
    sourceId: data.sourceId,
    sessionId: data.sessionId,
  });

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
