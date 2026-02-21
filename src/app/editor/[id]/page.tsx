import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import { updateDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  // Extract plain text from TipTap JSON for textarea
  const content = document.content as {
    type: string;
    content?: Array<{
      type: string;
      content?: Array<{ type: string; text?: string }>;
    }>;
  };
  const plainText =
    content?.content
      ?.map((node) =>
        node.content?.map((inline) => inline.text || "").join("") || ""
      )
      .join("\n") || "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            &larr; Dashboard
          </Button>
        </Link>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          const title = formData.get("title") as string;
          const text = formData.get("content") as string;

          // Wrap plain text in TipTap-compatible JSON
          const tiptapContent = {
            type: "doc",
            content: text
              .split("\n")
              .map((line) => ({
                type: "paragraph",
                content: line ? [{ type: "text", text: line }] : [],
              })),
          };

          // Count words
          const wordCount = text.trim()
            ? text.trim().split(/\s+/).length
            : 0;

          await updateDocument(id, {
            title,
            content: tiptapContent,
            wordCount,
          });
        }}
      >
        <input
          name="title"
          defaultValue={document.title}
          className="mb-4 w-full border-b border-transparent bg-transparent text-3xl font-bold outline-none focus:border-border"
          placeholder="Untitled"
        />

        <textarea
          name="content"
          defaultValue={plainText}
          className="min-h-[60vh] w-full resize-none bg-transparent text-lg leading-relaxed outline-none"
          placeholder="Start writing..."
        />

        <div className="mt-4 flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}
