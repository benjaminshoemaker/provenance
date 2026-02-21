"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateBadge } from "@/app/actions/badges";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  // Load data on mount
  useState(() => {
    (async () => {
      const { id } = await params;
      setDocumentId(id);

      try {
        const res = await fetch(`/api/preview/${id}`);
        if (res.status === 401 || res.status === 403) {
          router.push("/dashboard");
          return;
        }
        if (!res.ok) {
          router.push("/dashboard");
          return;
        }
        const data = await res.json();
        setPreviewData(data);
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  });

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
        <Link href={documentId ? `/editor/${documentId}` : "/dashboard"}>
          <Button variant="ghost" size="sm">
            &larr; Back to Editor
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Pre-Publish Preview</h1>
      </div>

      <div className="mb-6 rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
        <p className="font-medium text-yellow-800 dark:text-yellow-200">
          Everything shown here will be publicly visible to anyone with the badge
          link.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Document</h2>
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">{previewData.title}</h3>
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {previewData.content}
          </div>
        </div>
      </section>

      {previewData.interactions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            AI Interactions ({previewData.interactions.length})
          </h2>
          <div className="space-y-3">
            {previewData.interactions.map((interaction, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {interaction.mode}
                  </span>
                  <span>{interaction.action}</span>
                </div>
                <p className="mb-1 text-sm">
                  <span className="font-medium">Prompt:</span>{" "}
                  {interaction.prompt}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Response:</span>{" "}
                  {interaction.response}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {previewData.pasteEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            Paste Events ({previewData.pasteEvents.length})
          </h2>
          <div className="space-y-2">
            {previewData.pasteEvents.map((event, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <span>{event.sourceType}</span>
                <span className="text-muted-foreground">
                  {event.characterCount} characters
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {badgeResult ? (
        <section className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
          <h2 className="mb-3 text-lg font-semibold text-green-800 dark:text-green-200">
            Badge Generated!
          </h2>
          <p className="mb-3 text-sm text-green-700 dark:text-green-300">
            Verification URL:{" "}
            <a
              href={`/verify/${badgeResult.verificationId}`}
              className="underline"
            >
              /verify/{badgeResult.verificationId}
            </a>
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-green-800 dark:text-green-200">
                HTML Embed
              </label>
              <pre className="overflow-x-auto rounded bg-white p-2 text-xs dark:bg-gray-900">
                {badgeResult.badgeHtml}
              </pre>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-green-800 dark:text-green-200">
                Markdown Embed
              </label>
              <pre className="overflow-x-auto rounded bg-white p-2 text-xs dark:bg-gray-900">
                {badgeResult.badgeMarkdown}
              </pre>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex justify-end">
          <Button onClick={handleConfirm} disabled={generating}>
            {generating ? "Generating..." : "Confirm & Generate"}
          </Button>
        </div>
      )}
    </div>
  );
}
