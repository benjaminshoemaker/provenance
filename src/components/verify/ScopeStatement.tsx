export function ScopeStatement() {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-sm">
      <h3 className="mb-2 font-semibold">What this badge certifies</h3>
      <p className="mb-3 text-muted-foreground">
        This badge certifies that the writing process for this document was
        tracked using Provenance. It records AI interactions, paste events,
        and writing sessions to provide transparency about how the content
        was created.
      </p>
      <h3 className="mb-2 font-semibold">Methodology</h3>
      <p className="text-muted-foreground">
        AI percentage is calculated by analyzing origin marks on text nodes in
        the document. Text inserted by AI tools is marked at the point of
        insertion. If an AI-generated passage is modified by more than 20%
        from its original length, it is reclassified as human-written. Paste
        events from external sources are tracked separately. The audit trail
        is frozen at the time of badge generation and cannot be modified.
      </p>
    </div>
  );
}
