export function ScopeStatement() {
  return (
    <div className="space-y-3" data-testid="scope-statement">
      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          What this badge certifies
        </summary>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          This badge certifies that the writing process for this document was
          tracked using Provenance. It records AI interactions, paste events,
          and writing sessions to provide transparency about how the content
          was created.
        </div>
      </details>

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          How the AI percentage is calculated
        </summary>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          AI percentage is calculated by analyzing origin marks on text nodes in
          the document. Text inserted by AI tools is marked at the point of
          insertion. If an AI-generated passage is modified by more than 20%
          from its original length, it is reclassified as human-written. Paste
          events from external sources are tracked separately. The audit trail
          is frozen at the time of badge generation and cannot be modified.
        </div>
      </details>

      <details className="rounded-lg border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          What is public vs private
        </summary>
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          Public verification pages show the frozen document snapshot, AI
          interaction logs used for provenance, paste/session metadata, and
          computed statistics. Private account data, OAuth credentials,
          provider secrets, and unpublished drafts are never exposed on the
          public badge page. Document owners control when a badge is published
          and can take badges down.
        </div>
      </details>
    </div>
  );
}
