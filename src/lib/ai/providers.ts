import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import type { AIProvider } from "./types";

export const providers: Record<string, AIProvider> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-5-20250929",
    models: [
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", tier: "standard" },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "standard" },
      { id: "claude-opus-4-5-20250918", name: "Claude Opus 4.5", tier: "standard" },
      { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", tier: "standard" },
      { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", tier: "fast" },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-5.2",
    models: [
      { id: "gpt-5.2", name: "GPT-5.2", tier: "standard" },
      { id: "gpt-5.1", name: "GPT-5.1", tier: "standard" },
      { id: "gpt-5-mini", name: "GPT-5 Mini", tier: "fast" },
      { id: "gpt-5-nano", name: "GPT-5 Nano", tier: "fast" },
    ],
  },
};

export function isValidModel(providerId: string, modelId: string): boolean {
  const provider = providers[providerId];
  if (!provider) return false;
  return provider.models.some((m) => m.id === modelId);
}

export function getModel(providerId: string, modelId?: string) {
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);

  const modelName = modelId || provider.defaultModel;

  if (providerId === "anthropic") {
    return anthropic(modelName);
  }
  return openai(modelName);
}
