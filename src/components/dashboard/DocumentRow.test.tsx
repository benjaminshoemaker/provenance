import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentRow } from "./DocumentRow";

describe("DocumentRow", () => {
  const defaultProps = {
    id: "doc-1",
    title: "Test Document",
    updatedAt: new Date().toISOString(),
    wordCount: 500,
    preview: "This is a preview of the document content...",
    aiPercentage: 12,
    hasBadge: true,
    onClick: vi.fn(),
  };

  it("should render title, preview, word count, and relative date", () => {
    render(<DocumentRow {...defaultProps} />);

    expect(screen.getByText("Test Document")).toBeDefined();
    expect(screen.getByText("This is a preview of the document content...")).toBeDefined();
    expect(screen.getByText("500 words")).toBeDefined();
  });

  it("should show emerald dot when document has badge", () => {
    const { container } = render(<DocumentRow {...defaultProps} hasBadge={true} />);

    const dot = container.querySelector(".bg-emerald-500");
    expect(dot).toBeTruthy();
  });

  it("should show gray dot for draft documents", () => {
    const { container } = render(<DocumentRow {...defaultProps} hasBadge={false} />);

    const dot = container.querySelector('[class*="bg-muted-foreground/50"]');
    expect(dot).toBeTruthy();
  });

  it("should show AI percentage badge", () => {
    render(<DocumentRow {...defaultProps} aiPercentage={12} />);

    expect(screen.getByText("12% AI")).toBeDefined();
  });

  it("should show view badge link when latest verification id exists", () => {
    render(
      <DocumentRow
        {...defaultProps}
        latestBadgeVerificationId="badge-verify-123"
      />
    );

    expect(screen.getByRole("link", { name: "View badge" })).toHaveAttribute(
      "href",
      "/verify/badge-verify-123"
    );
  });

  it("should dim archived rows with opacity-60", () => {
    const { container } = render(
      <DocumentRow {...defaultProps} isArchived={true} />
    );

    const row = container.querySelector("[role='button']");
    expect(row?.className).toContain("opacity-60");
  });

  it("should call onDelete with doc id when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<DocumentRow {...defaultProps} onDelete={onDelete} />);

    const deleteBtn = screen.getByLabelText("Delete Test Document");
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith("doc-1");
  });

  it("should show lighter gray dot for archived documents", () => {
    const { container } = render(
      <DocumentRow {...defaultProps} hasBadge={false} isArchived={true} />
    );

    const dot = container.querySelector('[class*="bg-muted-foreground/30"]');
    expect(dot).toBeTruthy();
  });
});
