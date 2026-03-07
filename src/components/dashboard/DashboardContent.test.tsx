import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("@/app/actions/documents", () => ({
  deleteDocument: vi.fn(),
}));

import { DashboardContent } from "./DashboardContent";

const mockDocs = [
  {
    id: "doc-1",
    title: "First Document",
    updatedAt: new Date().toISOString(),
    wordCount: 500,
    deletedAt: null,
    preview: "Preview of first doc",
    aiPercentage: 15,
    badgeCount: 1,
  },
  {
    id: "doc-2",
    title: "Second Document",
    updatedAt: new Date().toISOString(),
    wordCount: 200,
    deletedAt: null,
    preview: "Preview of second doc",
    aiPercentage: null,
    badgeCount: 0,
  },
];

describe("DashboardContent", () => {
  it("should render sidebar and document list", () => {
    render(
      <DashboardContent
        documents={mockDocs}
        referenceNowMs={Date.now()}
        createAction={vi.fn()}
      />
    );

    expect(screen.getByText("All Documents")).toBeDefined();
    expect(screen.getByText("First Document")).toBeDefined();
    expect(screen.getByText("Second Document")).toBeDefined();
  });

  it("should filter documents by search query", () => {
    render(
      <DashboardContent
        documents={mockDocs}
        referenceNowMs={Date.now()}
        createAction={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search documents...");
    fireEvent.change(searchInput, { target: { value: "First" } });

    expect(screen.getByText("First Document")).toBeDefined();
    expect(screen.queryByText("Second Document")).toBeNull();
  });

  it("should filter by 'Has Badge' chip", () => {
    render(
      <DashboardContent
        documents={mockDocs}
        referenceNowMs={Date.now()}
        createAction={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Has Badge"));

    expect(screen.getByText("First Document")).toBeDefined();
    expect(screen.queryByText("Second Document")).toBeNull();
  });

  it("should filter by 'Drafts' chip", () => {
    render(
      <DashboardContent
        documents={mockDocs}
        referenceNowMs={Date.now()}
        createAction={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Drafts"));

    expect(screen.queryByText("First Document")).toBeNull();
    expect(screen.getByText("Second Document")).toBeDefined();
  });

  it("should render New Document button with provenance styling", () => {
    const { container } = render(
      <DashboardContent
        documents={mockDocs}
        referenceNowMs={Date.now()}
        createAction={vi.fn()}
      />
    );

    const newDocButton = container.querySelector(".bg-provenance-600");
    expect(newDocButton).toBeTruthy();
    expect(newDocButton?.textContent).toContain("New Document");
  });
});
