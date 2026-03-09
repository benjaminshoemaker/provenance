import { Clock3, FileText, Sparkles, Timer } from "lucide-react";

interface StatsSummaryProps {
  stats: {
    typed_percentage: number;
    human_typed_percentage: number;
    ai_generated_percentage: number;
    ai_tweaked_percentage: number;
    pasted_external_percentage: number;
    human_typed_words: number;
    ai_generated_words: number;
    ai_tweaked_words: number;
    pasted_external_words: number;
    total_words: number;
    interaction_count: number;
    session_count: number;
    total_active_seconds: number;
  };
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const typedPercentage =
    stats.typed_percentage ?? stats.human_typed_percentage;
  const humanTypedPercentage =
    stats.human_typed_percentage ?? typedPercentage;
  const aiGeneratedPercentage = stats.ai_generated_percentage ?? 0;
  const aiTweakedPercentage = stats.ai_tweaked_percentage ?? 0;
  const pastedExternalPercentage = stats.pasted_external_percentage ?? 0;

  const totalWords = stats.total_words ?? 0;
  const humanTypedWords = stats.human_typed_words ?? 0;
  const aiGeneratedWords = stats.ai_generated_words ?? 0;
  const aiTweakedWords = stats.ai_tweaked_words ?? 0;
  const pastedExternalWords = stats.pasted_external_words ?? 0;

  const hours = Math.floor(stats.total_active_seconds / 3600);
  const minutes = Math.floor((stats.total_active_seconds % 3600) / 60);
  const timeDisplay = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div data-testid="stats-summary">
      <div className="mb-4 text-center" data-testid="hero-stat">
        <span className="text-4xl font-bold tabular-nums text-foreground sm:text-5xl">
          {typedPercentage}%
        </span>
        <span className="ml-2 text-lg text-muted-foreground">typed</span>

        <span
          className="relative ml-2 hidden sm:inline-block"
          data-testid="methodology-tooltip"
        >
          <span className="group cursor-help">
            <span className="inline-flex items-center gap-1 text-sm text-provenance-600 decoration-dashed underline underline-offset-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                  clipRule="evenodd"
                />
              </svg>
              How is this calculated?
            </span>
            <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-80 -translate-x-1/2 rounded-lg border bg-white p-4 text-left shadow-lg opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="mb-2 text-sm font-semibold text-foreground">About this percentage</div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Represents the share of final words typed directly by the author and never processed by AI.
                The full breakdown includes AI-generated words, AI-tweaked words, and pasted words.
              </p>
              <div className="border-t pt-2 text-xs leading-relaxed text-muted-foreground">
                Pasted words are tracked as origin-unverifiable content from outside Provenance.
              </div>
            </div>
          </span>
        </span>

        <div className="mt-2 sm:hidden" data-testid="methodology-mobile">
          <details className="inline-block text-left">
            <summary className="cursor-pointer text-sm text-provenance-600 decoration-dashed underline underline-offset-2">
              <span className="inline-flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
                How is this calculated?
              </span>
            </summary>
            <div className="mt-2 rounded-lg border bg-muted p-3">
              <div className="mb-1 text-xs font-semibold text-foreground">About this percentage</div>
              <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                Represents the share of final words typed directly by the author and never processed by AI.
                The full breakdown includes AI-generated words, AI-tweaked words, and pasted words.
              </p>
              <div className="border-t pt-2 text-xs leading-relaxed text-muted-foreground">
                Pasted words are tracked as origin-unverifiable content from outside Provenance.
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="mb-3" data-testid="horizontal-bar">
        <div className="flex h-4 overflow-hidden rounded-full bg-secondary">
          {humanTypedPercentage > 0 && (
            <div
              className="bg-gray-700 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${humanTypedPercentage}%` }}
            />
          )}
          {aiGeneratedPercentage > 0 && (
            <div
              className="bg-sky-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${aiGeneratedPercentage}%` }}
            />
          )}
          {aiTweakedPercentage > 0 && (
            <div
              className="bg-teal-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${aiTweakedPercentage}%` }}
            />
          )}
          {pastedExternalPercentage > 0 && (
            <div
              className="bg-orange-400 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pastedExternalPercentage}%` }}
            />
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-700" />
          Human typed · {humanTypedPercentage}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" />
          AI generated · {aiGeneratedPercentage}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-500" />
          AI tweaked · {aiTweakedPercentage}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-400" />
          Pasted outside · {pastedExternalPercentage}%
        </span>
      </div>

      <p className="mb-3 text-center text-sm text-muted-foreground" data-testid="plain-language">
        Of {totalWords.toLocaleString()} words: {humanTypedWords.toLocaleString()} typed by the author,
        {" "}{aiGeneratedWords.toLocaleString()} AI-generated, {aiTweakedWords.toLocaleString()} AI-tweaked,
        {" "}{pastedExternalWords.toLocaleString()} pasted from outside Provenance.
      </p>

      <div
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
        data-testid="secondary-stats"
      >
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {stats.interaction_count} AI interaction{stats.interaction_count !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {stats.session_count} session{stats.session_count !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {timeDisplay} active time
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {totalWords.toLocaleString()} words
        </span>
      </div>
    </div>
  );
}
