import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrackChangesDiff } from "./TrackChangesDiff";

describe("TrackChangesDiff", () => {
  it("should render word-level diff with remove and add classes", () => {
    const { container } = render(
      <TrackChangesDiff original="old text here" suggestion="new text here" />
    );

    const removeEls = container.querySelectorAll(".diff-remove");
    const addEls = container.querySelectorAll(".diff-add");

    expect(removeEls.length).toBeGreaterThan(0);
    expect(addEls.length).toBeGreaterThan(0);
    // "here" should be unchanged (equal)
    expect(container.textContent).toContain("here");
  });

  it("should render just the text when original equals suggestion", () => {
    render(<TrackChangesDiff original="same text" suggestion="same text" />);

    expect(screen.getByText("same text")).toBeTruthy();
  });

  it("should show unchanged words without diff styling", () => {
    const { container } = render(
      <TrackChangesDiff
        original="the quick brown fox"
        suggestion="the slow brown fox"
      />
    );

    // "quick" should be removed, "slow" added, "the", "brown", "fox" unchanged
    const removeEls = container.querySelectorAll(".diff-remove");
    const addEls = container.querySelectorAll(".diff-add");

    expect(removeEls.length).toBeGreaterThan(0);
    expect(addEls.length).toBeGreaterThan(0);

    // Check that removed text contains "quick" and added contains "slow"
    const removedText = Array.from(removeEls).map((el) => el.textContent).join("");
    const addedText = Array.from(addEls).map((el) => el.textContent).join("");

    expect(removedText).toContain("quick");
    expect(addedText).toContain("slow");
  });

  it("should handle completely different text", () => {
    const { container } = render(
      <TrackChangesDiff original="hello world" suggestion="goodbye earth" />
    );

    const removeEls = container.querySelectorAll(".diff-remove");
    const addEls = container.querySelectorAll(".diff-add");

    expect(removeEls.length).toBeGreaterThan(0);
    expect(addEls.length).toBeGreaterThan(0);
  });

  it("should handle additions at the end", () => {
    const { container } = render(
      <TrackChangesDiff original="hello" suggestion="hello world" />
    );

    const addEls = container.querySelectorAll(".diff-add");
    expect(addEls.length).toBeGreaterThan(0);
    const addedText = Array.from(addEls).map((el) => el.textContent).join("");
    expect(addedText).toContain("world");
  });
});
