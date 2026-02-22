import { describe, it, expect } from "vitest";
import { getAIPercentageColor } from "./badge-colors";

describe("getAIPercentageColor", () => {
  it("should return emerald for 0-25%", () => {
    expect(getAIPercentageColor(0).tailwind).toBe("emerald");
    expect(getAIPercentageColor(12).tailwind).toBe("emerald");
    expect(getAIPercentageColor(25).tailwind).toBe("emerald");
  });

  it("should return amber for 26-50%", () => {
    expect(getAIPercentageColor(26).tailwind).toBe("amber");
    expect(getAIPercentageColor(35).tailwind).toBe("amber");
    expect(getAIPercentageColor(50).tailwind).toBe("amber");
  });

  it("should return orange for 51-75%", () => {
    expect(getAIPercentageColor(51).tailwind).toBe("orange");
    expect(getAIPercentageColor(60).tailwind).toBe("orange");
    expect(getAIPercentageColor(75).tailwind).toBe("orange");
  });

  it("should return red for 76-100%", () => {
    expect(getAIPercentageColor(76).tailwind).toBe("red");
    expect(getAIPercentageColor(90).tailwind).toBe("red");
    expect(getAIPercentageColor(100).tailwind).toBe("red");
  });

  it("should have correct boundary values at 25/26", () => {
    expect(getAIPercentageColor(25).tailwind).toBe("emerald");
    expect(getAIPercentageColor(26).tailwind).toBe("amber");
  });

  it("should have correct boundary values at 50/51", () => {
    expect(getAIPercentageColor(50).tailwind).toBe("amber");
    expect(getAIPercentageColor(51).tailwind).toBe("orange");
  });

  it("should have correct boundary values at 75/76", () => {
    expect(getAIPercentageColor(75).tailwind).toBe("orange");
    expect(getAIPercentageColor(76).tailwind).toBe("red");
  });
});
