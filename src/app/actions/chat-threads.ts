"use server";

import { db } from "@/lib/db";
import { chatThreads } from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { eq, and, desc } from "drizzle-orm";

// Whitelist of allowed summary keys to prevent arbitrary client data
// from flowing into the public badge audit trail.
const ALLOWED_SUMMARY_KEYS = new Set([
  "messageCount",
  "durationMinutes",
  "category",
  "provider",
  "model",
  "tokenCount",
]);

function sanitizeSummary(
  raw: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    if (!ALLOWED_SUMMARY_KEYS.has(key)) continue;
    const val = raw[key];
    if (typeof val === "string" || typeof val === "number") {
      clean[key] = val;
    }
  }
  return clean;
}

export async function getChatThreads(documentId: string) {
  await requireDocumentOwner(documentId);

  return db
    .select({
      id: chatThreads.id,
      title: chatThreads.title,
      messageCount: chatThreads.messageCount,
      updatedAt: chatThreads.updatedAt,
    })
    .from(chatThreads)
    .where(eq(chatThreads.documentId, documentId))
    .orderBy(desc(chatThreads.updatedAt));
}

export async function getChatThread(threadId: string) {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId));

  if (!thread) throw new Error("Not found");

  await requireDocumentOwner(thread.documentId);

  return thread;
}

export async function saveChatThread(data: {
  documentId: string;
  threadId?: string;
  title?: string;
  messages: unknown[];
  messageCount: number;
  summary?: Record<string, unknown>;
}) {
  const { user } = await requireDocumentOwner(data.documentId);
  const safeSummary = sanitizeSummary(data.summary);

  if (data.threadId) {
    // Update existing thread — scope to documentId + userId to prevent
    // cross-user updates if someone guesses a thread ID.
    const [updated] = await db
      .update(chatThreads)
      .set({
        title: data.title,
        messages: data.messages,
        messageCount: data.messageCount,
        summary: safeSummary,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(chatThreads.id, data.threadId),
          eq(chatThreads.documentId, data.documentId),
          eq(chatThreads.userId, user.id!)
        )
      )
      .returning();

    if (!updated) throw new Error("Not found");

    return updated;
  }

  // Create new thread
  const [created] = await db
    .insert(chatThreads)
    .values({
      documentId: data.documentId,
      userId: user.id!,
      title: data.title ?? "New conversation",
      messages: data.messages,
      messageCount: data.messageCount,
      summary: safeSummary,
    })
    .returning();

  return created;
}

export async function deleteChatThread(threadId: string) {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId));

  if (!thread) throw new Error("Not found");

  await requireDocumentOwner(thread.documentId);

  await db.delete(chatThreads).where(eq(chatThreads.id, threadId));
}
