import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { AIProvider } from "./types";

export const providers: Record<string, AIProvider> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-5-20250514",
    models: [
      { id: "claude-sonnet-4-5-20250514", name: "Claude Sonnet 4.5", tier: "standard" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", tier: "fast" },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", name: "GPT-4o", tier: "standard" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", tier: "fast" },
    ],
  },
};

export function getModel(providerId: string, modelId?: string) {
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const modelName = modelId || provider.defaultModel;

  if (providerId === "anthropic") {
    return anthropic(modelName);
  }
  return openai(modelName);
}
