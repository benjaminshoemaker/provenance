import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [existingUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (existingUser) {
    return {
      ...session.user,
      id: existingUser.id,
      email: existingUser.email ?? session.user.email ?? null,
      name: existingUser.name ?? session.user.name ?? null,
      image: existingUser.image ?? session.user.image ?? null,
    };
  }

  if (!session.user.email) {
    throw new Error("Unauthorized");
  }

  const [existingUserByEmail] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (existingUserByEmail) {
    return {
      ...session.user,
      id: existingUserByEmail.id,
      email: existingUserByEmail.email ?? session.user.email,
      name: existingUserByEmail.name ?? session.user.name ?? null,
      image: existingUserByEmail.image ?? session.user.image ?? null,
    };
  }

  throw new Error("Unauthorized");
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
