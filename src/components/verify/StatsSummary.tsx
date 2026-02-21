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
    <div className="rounded-lg border bg-card p-4 sm:p-6">
      <div className="mb-4 text-center">
        <div className="text-4xl font-bold tabular-nums sm:text-5xl">
          {stats.ai_percentage}%
        </div>
        <div className="mt-1 text-sm text-muted-foreground">AI-generated</div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4 sm:gap-4">
        <div className="text-center">
          <div className="text-base font-semibold sm:text-lg">{humanPercentage}%</div>
          <div className="text-xs text-muted-foreground">Human-written</div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold sm:text-lg">
            {stats.interaction_count}
          </div>
          <div className="text-xs text-muted-foreground">AI interactions</div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold sm:text-lg">{stats.session_count}</div>
          <div className="text-xs text-muted-foreground">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold sm:text-lg">{timeDisplay}</div>
          <div className="text-xs text-muted-foreground">Total time</div>
        </div>
      </div>
    </div>
  );
}
