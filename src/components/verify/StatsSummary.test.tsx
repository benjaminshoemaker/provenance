import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsSummary } from "./StatsSummary";

describe("StatsSummary", () => {
  const defaultStats = {
    ai_percentage: 12,
    external_paste_percentage: 5,
    interaction_count: 8,
    session_count: 3,
    total_active_seconds: 7200,
    total_characters: 5000,
  };

  it("should render hero stat with emerald gradient", () => {
    const { container } = render(<StatsSummary stats={defaultStats} />);

    const heroStat = screen.getByTestId("hero-stat");
    expect(heroStat.textContent).toBe("12%");
    expect(heroStat.className).toContain("text-emerald-700");

    const gradientEl = container.querySelector(".from-emerald-50");
    expect(gradientEl).toBeTruthy();
  });

  it("should render 5-column grid on desktop", () => {
    const { container } = render(<StatsSummary stats={defaultStats} />);

    const desktopGrid = container.querySelector(".sm\\:grid-cols-5");
    expect(desktopGrid).toBeTruthy();
  });

  it("should render 2x2 grid for mobile", () => {
    render(<StatsSummary stats={defaultStats} />);

    const mobileLayout = screen.getByTestId("stats-mobile");
    expect(mobileLayout).toBeTruthy();
    expect(mobileLayout.querySelector(".grid-cols-2")).toBeTruthy();
  });

  it("should show correct human percentage", () => {
    render(<StatsSummary stats={defaultStats} />);

    // 100 - 12 - 5 = 83% (appears in both mobile and desktop)
    const elements = screen.getAllByText("83%");
    expect(elements.length).toBeGreaterThan(0);
  });

  it("should format time correctly", () => {
    render(<StatsSummary stats={defaultStats} />);

    const timeElements = screen.getAllByText("2h 0m");
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("should display all stat labels", () => {
    render(<StatsSummary stats={defaultStats} />);

    const aiLabels = screen.getAllByText("AI-generated");
    expect(aiLabels.length).toBeGreaterThan(0);
    const humanLabels = screen.getAllByText("Human-written");
    expect(humanLabels.length).toBeGreaterThan(0);
  });
});
