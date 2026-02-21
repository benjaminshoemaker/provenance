"use server";

import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { requireAuth, requireDocumentOwner } from "@/lib/auth/authorize";
import { eq } from "drizzle-orm";

export async function createDocument() {
  const user = await requireAuth();

  const [document] = await db
    .insert(documents)
    .values({ userId: user.id! })
    .returning();

  return document;
}

export async function updateDocument(
  documentId: string,
  data: { title?: string; content?: unknown; wordCount?: number }
) {
  await requireDocumentOwner(documentId);

  const [updated] = await db
    .update(documents)
    .set({
      ...data,
      content: data.content !== undefined ? data.content : undefined,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId))
    .returning();

  return updated;
}

export async function deleteDocument(documentId: string) {
  await requireDocumentOwner(documentId);

  await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(eq(documents.id, documentId));
}
