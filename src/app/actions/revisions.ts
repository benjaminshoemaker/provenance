"use server";

import { db } from "@/lib/db";
import { revisions } from "@/lib/db/schema";
import { requireDocumentOwner } from "@/lib/auth/authorize";
import { extractPlainText } from "@/lib/tiptap-utils";

interface CreateRevisionData {
  documentId: string;
  content: Record<string, unknown>;
  trigger: string;
}

export async function createRevision(data: CreateRevisionData) {
  await requireDocumentOwner(data.documentId);

  const plainText = extractPlainText(
    data.content as Parameters<typeof extractPlainText>[0]
  );

  const [revision] = await db
    .insert(revisions)
    .values({
      documentId: data.documentId,
      content: data.content,
      plainText,
      trigger: data.trigger,
    })
    .returning();

  return revision;
}
