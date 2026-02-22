import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsSummary } from "./StatsSummary";

describe("StatsSummary", () => {
  const defaultStats = {
    ai_percentage: 12,
    external_paste_percentage: 3,
    interaction_count: 8,
    session_count: 3,
    total_active_seconds: 8040, // 2h 14m
    total_characters: 14235, // ~2,847 words
  };

  it("should render hero stat without color judgment", () => {
    const { container } = render(<StatsSummary stats={defaultStats} />);

    const heroStat = screen.getByTestId("hero-stat");
    expect(heroStat.textContent).toContain("12%");
    expect(heroStat.textContent).toContain("AI-assisted");

    // No emerald gradient
    expect(container.querySelector(".from-emerald-50")).toBeNull();
    expect(container.querySelector(".text-emerald-700")).toBeNull();
  });

  it("should render three-way stacked bar", () => {
    const { container } = render(<StatsSummary stats={defaultStats} />);

    const bar = screen.getByTestId("stacked-bar");
    expect(bar).toBeTruthy();

    // Three segments with origin colors
    expect(bar.querySelector(".bg-gray-700")).toBeTruthy();
    expect(bar.querySelector(".bg-violet-500")).toBeTruthy();
    expect(bar.querySelector(".bg-orange-400")).toBeTruthy();
  });

  it("should render legend with all three origin types", () => {
    render(<StatsSummary stats={defaultStats} />);

    expect(screen.getByText(/Human-written · 85%/)).toBeTruthy();
    expect(screen.getByText(/AI-assisted · 12%/)).toBeTruthy();
    expect(screen.getByText(/Pasted · 3%/)).toBeTruthy();
  });

  it("should render plain-language sentence", () => {
    render(<StatsSummary stats={defaultStats} />);

    const sentence = screen.getByTestId("plain-language");
    expect(sentence.textContent).toContain("written by the author");
    expect(sentence.textContent).toContain("generated or rewritten by AI");
  });

  it("should render compact secondary stats", () => {
    render(<StatsSummary stats={defaultStats} />);

    const secondary = screen.getByTestId("secondary-stats");
    expect(secondary.textContent).toContain("8 AI interactions");
    expect(secondary.textContent).toContain("3 sessions");
    expect(secondary.textContent).toContain("2h 14m active time");
  });

  it("should handle zero paste percentage gracefully", () => {
    render(
      <StatsSummary
        stats={{ ...defaultStats, external_paste_percentage: 0 }}
      />
    );

    const bar = screen.getByTestId("stacked-bar");
    // No orange segment when paste is 0
    expect(bar.querySelector(".bg-orange-400")).toBeNull();
  });

  it("should render co-located methodology tooltip for desktop", () => {
    render(<StatsSummary stats={defaultStats} />);

    const tooltip = screen.getByTestId("methodology-tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain("How is this calculated?");
    expect(tooltip.textContent).toContain("About this percentage");
  });

  it("should render methodology expandable for mobile", () => {
    render(<StatsSummary stats={defaultStats} />);

    const mobile = screen.getByTestId("methodology-mobile");
    expect(mobile).toBeTruthy();
    expect(mobile.textContent).toContain("How is this calculated?");
  });
});
