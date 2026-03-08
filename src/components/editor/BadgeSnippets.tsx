"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BadgeSnippetsProps {
  badgeHtml: string;
  badgeMarkdown: string;
  verificationId: string;
}

export function BadgeSnippets({
  badgeHtml,
  badgeMarkdown,
  verificationId,
}: BadgeSnippetsProps) {
  const [copied, setCopied] = useState<"html" | "markdown" | null>(null);

  const copyToClipboard = async (text: string, type: "html" | "markdown") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Embed Your Badge</h3>
      <p className="text-sm text-muted-foreground">
        Verification URL:{" "}
        <a href={`/verify/${verificationId}`} className="text-primary underline">
          /verify/{verificationId}
        </a>
      </p>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium">HTML</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(badgeHtml, "html")}
            data-testid="copy-html-snippet"
          >
            {copied === "html" ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          {badgeHtml}
        </pre>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium">Markdown</label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(badgeMarkdown, "markdown")}
            data-testid="copy-markdown-snippet"
          >
            {copied === "markdown" ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded bg-muted p-2 text-xs">
          {badgeMarkdown}
        </pre>
      </div>
    </div>
  );
}
