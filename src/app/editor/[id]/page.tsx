import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditorShell } from "./editor-shell";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), isNull(documents.deletedAt)));

  if (!document) {
    notFound();
  }

  if (document.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const [prefs] = await db
    .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
    .from(users)
    .where(eq(users.id, session.user.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            &larr; Dashboard
          </Button>
        </Link>
      </div>

      <EditorShell
        documentId={document.id}
        initialTitle={document.title}
        initialContent={document.content as Record<string, unknown>}
        aiProvider={prefs?.aiProvider ?? "anthropic"}
        aiModel={prefs?.aiModel ?? null}
      />
    </div>
  );
}
