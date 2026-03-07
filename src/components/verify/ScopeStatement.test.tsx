import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScopeStatement } from "./ScopeStatement";

describe("ScopeStatement", () => {
  it("should render three collapsible details sections", () => {
    const { container } = render(<ScopeStatement />);

    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(3);
  });

  it("should have 'What this badge certifies' section", () => {
    render(<ScopeStatement />);
    expect(screen.getByText("What this badge certifies")).toBeDefined();
  });

  it("should have 'How the AI percentage is calculated' section", () => {
    render(<ScopeStatement />);
    expect(screen.getByText("How the AI percentage is calculated")).toBeDefined();
  });

  it("should have 'What is public vs private' section", () => {
    render(<ScopeStatement />);
    expect(screen.getByText("What is public vs private")).toBeDefined();
  });

  it("should use border rounded-lg styling", () => {
    const { container } = render(<ScopeStatement />);

    const details = container.querySelectorAll("details");
    for (const detail of details) {
      expect(detail.className).toContain("rounded-lg");
      expect(detail.className).toContain("border");
    }
  });
});
