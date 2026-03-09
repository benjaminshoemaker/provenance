import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsSummary } from "./StatsSummary";

describe("StatsSummary", () => {
  const defaultStats = {
    typed_percentage: 72,
    human_typed_percentage: 72,
    ai_generated_percentage: 8,
    ai_tweaked_percentage: 12,
    pasted_external_percentage: 8,
    human_typed_words: 720,
    ai_generated_words: 80,
    ai_tweaked_words: 120,
    pasted_external_words: 80,
    total_words: 1000,
    interaction_count: 8,
    session_count: 3,
    total_active_seconds: 8040, // 2h 14m
  };

  it("should render typed hero stat", () => {
    render(<StatsSummary stats={defaultStats} />);

    const heroStat = screen.getByTestId("hero-stat");
    expect(heroStat.textContent).toContain("72%");
    expect(heroStat.textContent).toContain("typed");
  });

  it("should render 4-segment horizontal bar", () => {
    render(<StatsSummary stats={defaultStats} />);

    const bar = screen.getByTestId("horizontal-bar");
    expect(bar).toBeTruthy();
    expect(bar.querySelector(".bg-gray-700")).toBeTruthy();
    expect(bar.querySelector(".bg-sky-500")).toBeTruthy();
    expect(bar.querySelector(".bg-teal-500")).toBeTruthy();
    expect(bar.querySelector(".bg-orange-400")).toBeTruthy();
  });

  it("should render legend with all four categories", () => {
    render(<StatsSummary stats={defaultStats} />);

    expect(screen.getByText(/Human typed · 72%/)).toBeTruthy();
    expect(screen.getByText(/AI generated · 8%/)).toBeTruthy();
    expect(screen.getByText(/AI tweaked · 12%/)).toBeTruthy();
    expect(screen.getByText(/Pasted outside · 8%/)).toBeTruthy();
  });

  it("should render plain-language sentence with all buckets", () => {
    render(<StatsSummary stats={defaultStats} />);

    const sentence = screen.getByTestId("plain-language");
    expect(sentence.textContent).toContain("typed by the author");
    expect(sentence.textContent).toContain("AI-generated");
    expect(sentence.textContent).toContain("AI-tweaked");
    expect(sentence.textContent).toContain("pasted from outside");
  });

  it("should render compact secondary stats", () => {
    render(<StatsSummary stats={defaultStats} />);

    const secondary = screen.getByTestId("secondary-stats");
    expect(secondary.textContent).toContain("8 AI interactions");
    expect(secondary.textContent).toContain("3 sessions");
    expect(secondary.textContent).toContain("2h 14m active time");
    expect(secondary.querySelectorAll("svg")).toHaveLength(4);
  });

  it("should hide zero-width pasted segment when pasted is 0", () => {
    render(
      <StatsSummary
        stats={{ ...defaultStats, pasted_external_percentage: 0, pasted_external_words: 0 }}
      />
    );

    const bar = screen.getByTestId("horizontal-bar");
    expect(bar.querySelector(".bg-orange-400")).toBeNull();
  });

  it("should render methodology tooltip for desktop and mobile", () => {
    render(<StatsSummary stats={defaultStats} />);

    expect(screen.getByTestId("methodology-tooltip").textContent).toContain(
      "How is this calculated?"
    );
    expect(screen.getByTestId("methodology-mobile").textContent).toContain(
      "How is this calculated?"
    );
  });
});
