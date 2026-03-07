import { describe, it, expect } from "vitest";
import { resolveProviderModel } from "./resolve-provider-model";

describe("resolveProviderModel", () => {
  it("should use requested provider/model when valid", () => {
    const result = resolveProviderModel({
      requestedProvider: "openai",
      requestedModel: "gpt-5.2",
      storedProvider: "anthropic",
      storedModel: "claude-sonnet-4-5-20250929",
    });

    expect(result).toEqual({
      provider: "openai",
      model: "gpt-5.2",
      invalidRequestedModel: false,
    });
  });

  it("should flag invalid requested model for provider", () => {
    const result = resolveProviderModel({
      requestedProvider: "openai",
      requestedModel: "claude-sonnet-4-5-20250929",
    });

    expect(result.invalidRequestedModel).toBe(true);
    expect(result.model).toBeUndefined();
  });

  it("should fall back to stored provider/model when request omits them", () => {
    const result = resolveProviderModel({
      storedProvider: "anthropic",
      storedModel: "claude-sonnet-4-5-20250929",
    });

    expect(result).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-5-20250929",
      invalidRequestedModel: false,
    });
  });

  it("should ignore invalid stored model and use provider default", () => {
    const result = resolveProviderModel({
      storedProvider: "anthropic",
      storedModel: "not-a-real-model",
    });

    expect(result).toEqual({
      provider: "anthropic",
      model: undefined,
      invalidRequestedModel: false,
    });
  });

  it("should default to anthropic when stored provider is invalid", () => {
    const result = resolveProviderModel({
      storedProvider: "bad-provider",
      storedModel: "gpt-5.2",
    });

    expect(result.provider).toBe("anthropic");
    expect(result.model).toBeUndefined();
    expect(result.invalidRequestedModel).toBe(false);
  });
});
