import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-4 text-sm font-medium text-primary">
          ◆ Provenance
        </div>
        <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Transparent AI Writing Verification
        </h1>
        <p className="mb-8 max-w-xl text-lg text-muted-foreground">
          Write with AI assistance and prove exactly how much. Provenance tracks
          every AI interaction, paste event, and writing session — then lets you
          share a verified badge anyone can audit.
        </p>
        <Link href="/login">
          <Button size="lg" variant="provenance">Get Started</Button>
        </Link>
      </section>

      {/* How it Works */}
      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight">
            How it Works
          </h2>

          <div className="grid gap-8 sm:grid-cols-2">
            {/* Writer flow */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">For Writers</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">1.</span>
                  Write in the editor with full AI assistance — inline
                  suggestions, side panel chat, or freeform generation.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">2.</span>
                  Every keystroke, AI call, and paste event is automatically
                  tracked with origin marks.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">3.</span>
                  Preview what will be public, then generate a verifiable badge
                  with one click.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">4.</span>
                  Embed the badge in your article, blog post, or portfolio.
                </li>
              </ol>
            </div>

            {/* Reader flow */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">For Readers</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">1.</span>
                  Click the Provenance badge on any verified document.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">2.</span>
                  See exactly what percentage was AI-generated vs human-written.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">3.</span>
                  Expand the full audit timeline — every AI prompt, response,
                  and editing session.
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 font-bold text-foreground">4.</span>
                  Trust the content because the process is transparent.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        Provenance — Transparent AI writing verification
      </footer>
    </div>
  );
}
