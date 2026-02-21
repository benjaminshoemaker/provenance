"use server";

import { db } from "@/lib/db";
import { aiInteractions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/authorize";

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
  await requireAuth();

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
