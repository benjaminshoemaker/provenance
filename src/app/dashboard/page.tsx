import { auth } from "@/auth";
import { db } from "@/lib/db";
import { documents, badges } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createDocument, deleteDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userDocuments = await db
    .select()
    .from(documents)
    .where(
      eq(documents.userId, session.user.id)
    )
    .orderBy(desc(documents.updatedAt));

  const activeDocuments = userDocuments.filter((doc) => !doc.deletedAt);

  // Fetch badge counts per document
  const badgeCountMap = new Map<string, number>();
  if (activeDocuments.length > 0) {
    const badgeCounts = await db
      .select({
        documentId: badges.documentId,
        count: sql<number>`count(*)::int`,
      })
      .from(badges)
      .where(
        sql`${badges.documentId} IN (${sql.join(
          activeDocuments.map((d) => sql`${d.id}`),
          sql`, `
        )})`
      )
      .groupBy(badges.documentId);

    for (const b of badgeCounts) {
      badgeCountMap.set(b.documentId, b.count);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Documents</h1>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <form
            action={async () => {
              "use server";
              const doc = await createDocument();
              redirect(`/editor/${doc.id}`);
            }}
          >
            <Button type="submit">New Document</Button>
          </form>
        </div>
      </div>

      {activeDocuments.length === 0 ? (
        <p className="text-muted-foreground">
          No documents yet. Create one to get started.
        </p>
      ) : (
        <div className="grid gap-4">
          {activeDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <Link href={`/editor/${doc.id}`} className="flex-1">
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>
                    Last modified:{" "}
                    {doc.updatedAt
                      ? new Date(doc.updatedAt).toLocaleDateString()
                      : "Unknown"}
                    {doc.wordCount ? ` · ${doc.wordCount} words` : ""}
                    {(badgeCountMap.get(doc.id) ?? 0) > 0 && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {badgeCountMap.get(doc.id)} Badge{badgeCountMap.get(doc.id)! > 1 ? "s" : ""}
                      </span>
                    )}
                  </CardDescription>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteDocument(doc.id);
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
