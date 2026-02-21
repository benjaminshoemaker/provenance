export default function EditorLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-10 w-3/4 animate-pulse rounded bg-muted mb-4" />
      <div className="h-[60vh] w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
