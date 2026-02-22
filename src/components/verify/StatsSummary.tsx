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

  const totalWords = Math.round(stats.total_characters / 5); // ~5 chars per word
  const humanWords = Math.round(totalWords * (humanPercentage / 100));
  const aiWords = Math.round(totalWords * (stats.ai_percentage / 100));
  const pasteWords = Math.round(totalWords * (stats.external_paste_percentage / 100));

  return (
    <div data-testid="stats-summary">
      {/* Headline stat — no color judgment */}
      <div className="mb-4 text-center" data-testid="hero-stat">
        <span className="text-4xl font-bold tabular-nums text-gray-900 sm:text-5xl">
          {stats.ai_percentage}%
        </span>
        <span className="ml-2 text-lg text-gray-500">AI-assisted</span>

        {/* Desktop: hover tooltip */}
        <span className="relative ml-2 hidden sm:inline-block" data-testid="methodology-tooltip">
          <span className="group cursor-help">
            <span className="inline-flex items-center gap-1 text-sm text-[#4c6ef5] decoration-dashed underline underline-offset-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              How is this calculated?
            </span>
            <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-80 -translate-x-1/2 rounded-lg border bg-white p-4 text-left shadow-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="mb-2 text-sm font-semibold text-gray-900">About this percentage</div>
              <p className="mb-3 text-xs leading-relaxed text-gray-600">
                Represents the proportion of final text that originated from accepted AI suggestions
                and remained substantially unchanged (&lt;20% modification). Text typed by the author,
                or AI text modified by more than 20%, is classified as human-written.
              </p>
              <div className="border-t pt-2 text-[10px] leading-relaxed text-gray-400">
                Does not account for: AI used outside this tool, pre-writing research,
                or ideas from AI conversation typed manually.
              </div>
            </div>
          </span>
        </span>

        {/* Mobile: inline expandable */}
        <div className="mt-2 sm:hidden" data-testid="methodology-mobile">
          <details className="inline-block text-left">
            <summary className="cursor-pointer text-sm text-[#4c6ef5] decoration-dashed underline underline-offset-2">
              <span className="inline-flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                How is this calculated?
              </span>
            </summary>
            <div className="mt-2 rounded-lg border bg-gray-50 p-3">
              <div className="mb-1 text-xs font-semibold text-gray-900">About this percentage</div>
              <p className="mb-2 text-xs leading-relaxed text-gray-600">
                Represents the proportion of final text that originated from accepted AI suggestions
                and remained substantially unchanged (&lt;20% modification). Text typed by the author,
                or AI text modified by more than 20%, is classified as human-written.
              </p>
              <div className="border-t pt-2 text-[10px] leading-relaxed text-gray-400">
                Does not account for: AI used outside this tool, pre-writing research,
                or ideas from AI conversation typed manually.
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Three-way stacked bar */}
      <div className="mb-3" data-testid="stacked-bar">
        <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
          {humanPercentage > 0 && (
            <div
              className="bg-gray-700 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${humanPercentage}%` }}
            />
          )}
          {stats.ai_percentage > 0 && (
            <div
              className="bg-violet-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${stats.ai_percentage}%` }}
            />
          )}
          {stats.external_paste_percentage > 0 && (
            <div
              className="bg-orange-400 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${stats.external_paste_percentage}%` }}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-700" />
          Human-written · {humanPercentage}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />
          AI-assisted · {stats.ai_percentage}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
          Pasted · {stats.external_paste_percentage}%
        </span>
      </div>

      {/* Plain-language sentence */}
      <p className="mb-5 text-center text-sm text-gray-500" data-testid="plain-language">
        Of {totalWords.toLocaleString()} words: ~{humanWords.toLocaleString()} written by the author,
        ~{aiWords.toLocaleString()} generated or rewritten by AI
        {pasteWords > 0 && <>, ~{pasteWords.toLocaleString()} pasted from external sources</>}.
      </p>

      {/* Secondary stats — compact horizontal row */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500" data-testid="secondary-stats">
        <span>{stats.interaction_count} AI interaction{stats.interaction_count !== 1 ? "s" : ""}</span>
        <span className="text-gray-300">·</span>
        <span>{stats.session_count} session{stats.session_count !== 1 ? "s" : ""}</span>
        <span className="text-gray-300">·</span>
        <span>{timeDisplay} active time</span>
        <span className="text-gray-300">·</span>
        <span>{totalWords.toLocaleString()} words</span>
      </div>
    </div>
  );
}
