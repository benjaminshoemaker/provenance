import { describe, it, expect } from "vitest";

describe("sample test", () => {
  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    expect("Provenance").toContain("Provenance");
  });
});
