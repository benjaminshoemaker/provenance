import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const USER_IDENTITY_SELECT = {
  id: users.id,
  email: users.email,
  name: users.name,
  image: users.image,
};

type SessionUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

async function findUserById(userId: string) {
  const [user] = await db
    .select(USER_IDENTITY_SELECT)
    .from(users)
    .where(eq(users.id, userId));

  return user;
}

async function findUserByEmail(email: string) {
  const [user] = await db
    .select(USER_IDENTITY_SELECT)
    .from(users)
    .where(eq(users.email, email));

  return user;
}

function mergeSessionUser(
  sessionUser: SessionUser,
  existingUser: Awaited<ReturnType<typeof findUserById>>
) {
  return {
    ...sessionUser,
    id: existingUser.id,
    email: existingUser.email ?? sessionUser.email ?? null,
    name: existingUser.name ?? sessionUser.name ?? null,
    image: existingUser.image ?? sessionUser.image ?? null,
  };
}

export async function requireAuth() {
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    throw new Error("Unauthorized");
  }

  const existingById = await findUserById(sessionUser.id);
  if (existingById) {
    return mergeSessionUser(sessionUser, existingById);
  }

  if (!sessionUser.email) {
    throw new Error("Unauthorized");
  }

  const existingByEmail = await findUserByEmail(sessionUser.email);
  if (existingByEmail) {
    return mergeSessionUser(sessionUser, existingByEmail);
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
