import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { BackLink } from "./BackLink";

describe("BackLink", () => {
  it("should render with default label 'Dashboard'", () => {
    render(<BackLink href="/dashboard" />);

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByRole("link")).toBeDefined();
  });

  it("should render with custom label", () => {
    render(<BackLink href="/settings" label="Settings" />);

    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("should link to the provided href", () => {
    render(<BackLink href="/dashboard" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/dashboard");
  });
});
