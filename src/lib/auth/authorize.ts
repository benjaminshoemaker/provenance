import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return { ...session.user, id: session.user.id };
}

export async function requireDocumentOwner(documentId: string) {
  const user = await requireAuth();

  const [document] = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.id, documentId), isNull(documents.deletedAt))
    );

  if (!document) {
    throw new Error("Not found");
  }

  if (document.userId !== user.id) {
    throw new Error("Forbidden");
  }

  return { user, document };
}
