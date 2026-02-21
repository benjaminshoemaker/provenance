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
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 text-center">
        <div className="text-5xl font-bold tabular-nums">
          {stats.ai_percentage}%
        </div>
        <div className="mt-1 text-sm text-muted-foreground">AI-generated</div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
        <div className="text-center">
          <div className="text-lg font-semibold">{humanPercentage}%</div>
          <div className="text-xs text-muted-foreground">Human-written</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">
            {stats.interaction_count}
          </div>
          <div className="text-xs text-muted-foreground">AI interactions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{stats.session_count}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{timeDisplay}</div>
          <div className="text-xs text-muted-foreground">Total time</div>
        </div>
      </div>
    </div>
  );
}
