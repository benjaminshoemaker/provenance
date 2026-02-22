import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock process.env before imports
vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://provenance.app");

import { generateBadgeHtml, generateBadgeMarkdown } from "./badge-snippets";

describe("badge-snippets", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://provenance.app");
  });

  describe("generateBadgeHtml", () => {
    it("should include correct alt text with percentage and URL", () => {
      const html = generateBadgeHtml("abc123", 12);

      expect(html).toContain("abc123");
      expect(html).toContain("12% AI");
      expect(html).toContain("/verify/abc123");
      expect(html).toContain("/api/badges/abc123/image");
      expect(html).toContain("alt=");
    });

    it("should include correct image URL", () => {
      const html = generateBadgeHtml("test-id", 25);

      expect(html).toContain(
        'src="https://provenance.app/api/badges/test-id/image"'
      );
    });

    it("should wrap image in verification link", () => {
      const html = generateBadgeHtml("test-id", 25);

      expect(html).toContain(
        '<a href="https://provenance.app/verify/test-id">'
      );
    });
  });

  describe("generateBadgeMarkdown", () => {
    it("should include percentage and verification URL", () => {
      const md = generateBadgeMarkdown("abc123", 12);

      expect(md).toContain("abc123");
      expect(md).toContain("12% AI");
      expect(md).toContain("/verify/abc123");
      expect(md).toContain("/api/badges/abc123/image");
    });

    it("should use markdown image-link syntax", () => {
      const md = generateBadgeMarkdown("test-id", 30);

      expect(md).toMatch(/^\[!\[.*\]\(.*\)\]\(.*\)$/);
    });
  });
});
