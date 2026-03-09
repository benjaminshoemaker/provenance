import { requireDocumentOwner } from "@/lib/auth/authorize";
import { db } from "@/lib/db";
import { writingSessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SessionOwnershipInput {
  documentId: string;
  sourceId?: string;
  sessionId?: string;
}

export async function validateSessionOwnership({
  documentId,
  sourceId,
  sessionId,
}: SessionOwnershipInput) {
  if (sourceId && !UUID_RE.test(sourceId)) {
    throw new Error("Invalid sourceId");
  }

  const { user } = await requireDocumentOwner(documentId);

  if (!sessionId) {
    return user;
  }

  const [session] = await db
    .select({ id: writingSessions.id })
    .from(writingSessions)
    .where(
      and(
        eq(writingSessions.id, sessionId),
        eq(writingSessions.userId, user.id),
        eq(writingSessions.documentId, documentId)
      )
    );

  if (!session) {
    throw new Error("Not found");
  }

  return user;
}
