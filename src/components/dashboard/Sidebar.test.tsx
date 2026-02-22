import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("should render 4 nav items and settings", () => {
    render(
      <Sidebar activeFilter="all" onFilterChange={vi.fn()} />
    );

    expect(screen.getByText("All Documents")).toBeDefined();
    expect(screen.getByText("Recent")).toBeDefined();
    expect(screen.getByText("Archive")).toBeDefined();
    expect(screen.getByText("Trash")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("should highlight active item with provenance styling", () => {
    const { container } = render(
      <Sidebar activeFilter="all" onFilterChange={vi.fn()} />
    );

    const activeButton = container.querySelector(".bg-provenance-50");
    expect(activeButton).toBeTruthy();
    expect(activeButton?.textContent).toContain("All Documents");
  });

  it("should call onFilterChange when nav item clicked", () => {
    const onFilterChange = vi.fn();
    render(
      <Sidebar activeFilter="all" onFilterChange={onFilterChange} />
    );

    fireEvent.click(screen.getByText("Recent"));
    expect(onFilterChange).toHaveBeenCalledWith("recent");
  });

  it("should render settings at bottom via mt-auto", () => {
    const { container } = render(
      <Sidebar activeFilter="all" onFilterChange={vi.fn()} />
    );

    const settingsContainer = container.querySelector(".mt-auto");
    expect(settingsContainer).toBeTruthy();
    expect(settingsContainer?.textContent).toContain("Settings");
  });

  it("should render Provenance branding at the top", () => {
    render(
      <Sidebar activeFilter="all" onFilterChange={vi.fn()} />
    );

    expect(screen.getByText("Provenance")).toBeDefined();
  });
});
