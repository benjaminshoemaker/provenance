"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateBadge } from "@/app/actions/badges";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  return <PreviewContent params={params} />;
}

function PreviewContent({ params }: PreviewPageProps) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [badgeResult, setBadgeResult] = useState<{
    verificationId: string;
    badgeHtml: string;
    badgeMarkdown: string;
  } | null>(null);
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    interactions: Array<{
      mode: string;
      prompt: string;
      response: string;
      action: string;
      createdAt: string | Date | null;
    }>;
    pasteEvents: Array<{
      sourceType: string;
      characterCount: number;
      createdAt: string | Date | null;
    }>;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { id } = await params;
      if (cancelled) return;
      setDocumentId(id);

      try {
        const res = await fetch(`/api/preview/${id}`);
        if (cancelled) return;
        if (res.status === 401 || res.status === 404) {
          router.push("/dashboard");
          return;
        }
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setPreviewData(data);
      } catch {
        if (!cancelled) router.push("/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params, router]);

  const handleConfirm = async () => {
    if (!documentId) return;
    setGenerating(true);
    try {
      const result = await generateBadge(documentId);
      setBadgeResult({
        verificationId: result.verificationId,
        badgeHtml: result.badgeHtml,
        badgeMarkdown: result.badgeMarkdown,
      });
    } catch (error) {
      console.error("Failed to generate badge:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href={documentId ? `/editor/${documentId}` : "/dashboard"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Editor
        </Link>
        <h1 className="text-xl font-semibold">Pre-Publish Preview</h1>
      </div>

      {/* Amber warning banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border-b border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-800">
          Everything shown below will be publicly visible to anyone with the badge link.
        </p>
      </div>

      {/* Stat summary (3-col) */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <div className="text-lg font-semibold">{previewData.interactions.length}</div>
          <div className="text-xs text-muted-foreground">AI Interactions</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-lg font-semibold">{previewData.pasteEvents.length}</div>
          <div className="text-xs text-muted-foreground">Paste Events</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <div className="text-lg font-semibold">{previewData.content.split(/\s+/).filter(Boolean).length}</div>
          <div className="text-xs text-muted-foreground">Words</div>
        </div>
      </div>

      {/* Expandable sections */}
      {previewData.interactions.length > 0 && (
        <details className="mb-4 rounded-lg border border-violet-200 bg-violet-50/30">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            AI Interactions ({previewData.interactions.length})
          </summary>
          <div className="space-y-3 border-t px-4 py-3">
            {previewData.interactions.map((interaction, i) => (
              <div key={i} className="rounded-lg border bg-background p-3">
                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-violet-100 px-2 py-0.5 font-medium text-violet-700">
                    {interaction.mode}
                  </span>
                  <span>{interaction.action}</span>
                </div>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Prompt:</span> {interaction.prompt}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Response:</span> {interaction.response}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {previewData.pasteEvents.length > 0 && (
        <details className="mb-4 rounded-lg border border-orange-200 bg-orange-50/30">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
            Paste Events ({previewData.pasteEvents.length})
          </summary>
          <div className="space-y-2 border-t px-4 py-3">
            {previewData.pasteEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border bg-background p-3 text-sm"
              >
                <span>{event.sourceType}</span>
                <span className="text-muted-foreground">{event.characterCount} characters</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="mb-6 rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          Document Text
        </summary>
        <div className="border-t px-4 py-3">
          <h3 className="mb-2 font-medium">{previewData.title}</h3>
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
            {previewData.content}
          </div>
        </div>
      </details>

      {/* Permanence note */}
      <div className="mb-6 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Once generated, this badge and its audit trail are permanent and cannot be modified or deleted.
        The verification page will be publicly accessible via a unique URL.
      </div>

      {badgeResult ? (
        <section
          className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950"
          data-testid="badge-result"
        >
          <h2 className="mb-3 text-lg font-semibold text-green-800 dark:text-green-200">
            Badge Generated!
          </h2>
          <p className="mb-3 text-sm text-green-700 dark:text-green-300">
            Verification URL:{" "}
            <a
              href={`/verify/${badgeResult.verificationId}`}
              className="underline"
              data-testid="verification-url"
            >
              /verify/{badgeResult.verificationId}
            </a>
          </p>
          <div className="space-y-3">
            <div data-testid="badge-html-snippet">
              <label className="mb-1 block text-xs font-medium text-green-800 dark:text-green-200">
                HTML Embed
              </label>
              <pre className="overflow-x-auto rounded bg-white p-2 text-xs dark:bg-secondary">
                {badgeResult.badgeHtml}
              </pre>
            </div>
            <div data-testid="badge-markdown-snippet">
              <label className="mb-1 block text-xs font-medium text-green-800 dark:text-green-200">
                Markdown Embed
              </label>
              <pre className="overflow-x-auto rounded bg-white p-2 text-xs dark:bg-secondary">
                {badgeResult.badgeMarkdown}
              </pre>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="provenance"
            size="lg"
            onClick={handleConfirm}
            disabled={generating}
            data-testid="confirm-generate-badge"
          >
            {generating ? "Generating..." : "Confirm & Generate Badge"}
          </Button>
        </div>
      )}
    </div>
  );
}
