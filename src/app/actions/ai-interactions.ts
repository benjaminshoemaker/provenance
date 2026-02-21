"use server";

import { db } from "@/lib/db";
import { aiInteractions, writingSessions } from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { and, eq } from "drizzle-orm";

interface LogAIInteractionData {
  documentId: string;
  sessionId?: string;
  mode: string;
  prompt: string;
  selectedText?: string;
  response: string;
  action: string;
  documentDiff?: unknown;
  charactersInserted?: number;
  provider: string;
  model: string;
}

export async function logAIInteraction(data: LogAIInteractionData) {
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

  const [interaction] = await db
    .insert(aiInteractions)
    .values({
      documentId: data.documentId,
      sessionId: data.sessionId,
      mode: data.mode,
      prompt: data.prompt,
      selectedText: data.selectedText,
      response: data.response,
      action: data.action,
      documentDiff: data.documentDiff,
      charactersInserted: data.charactersInserted ?? 0,
      provider: data.provider,
      model: data.model,
    })
    .returning();

  return interaction;
}
