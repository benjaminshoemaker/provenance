interface StatsSummaryProps {
  stats: {
    ai_percentage: number;
    external_paste_percentage: number;
    interaction_count: number;
    session_count: number;
    total_active_seconds: number;
    total_characters: number;
  };
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const humanPercentage =
    100 - stats.ai_percentage - stats.external_paste_percentage;
  const hours = Math.floor(stats.total_active_seconds / 3600);
  const minutes = Math.floor((stats.total_active_seconds % 3600) / 60);
  const timeDisplay =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div data-testid="stats-summary">
      {/* Desktop: 5-col grid */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-5">
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6">
          <div className="text-4xl font-bold tabular-nums text-emerald-700" data-testid="hero-stat">
            {stats.ai_percentage}%
          </div>
          <div className="mt-1 text-sm text-emerald-600">AI-generated</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <div className="text-lg font-semibold">{humanPercentage}%</div>
          <div className="text-xs text-muted-foreground">Human-written</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <div className="text-lg font-semibold">{stats.interaction_count}</div>
          <div className="text-xs text-muted-foreground">AI chats</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <div className="text-lg font-semibold">{stats.session_count}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="rounded-xl bg-gray-50 p-5 text-center">
          <div className="text-lg font-semibold">{timeDisplay}</div>
          <div className="text-xs text-muted-foreground">Total time</div>
        </div>
      </div>

      {/* Mobile: full-width hero + 2x2 grid */}
      <div className="space-y-3 sm:hidden" data-testid="stats-mobile">
        <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6">
          <div className="text-5xl font-bold tabular-nums text-emerald-700">
            {stats.ai_percentage}%
          </div>
          <div className="mt-1 text-sm text-emerald-600">AI-generated</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold">{humanPercentage}%</div>
            <div className="text-xs text-muted-foreground">Human-written</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold">{stats.interaction_count}</div>
            <div className="text-xs text-muted-foreground">AI chats</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold">{stats.session_count}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-lg font-semibold">{timeDisplay}</div>
            <div className="text-xs text-muted-foreground">Total time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
