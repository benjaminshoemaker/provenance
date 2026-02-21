export interface AIModel {
  id: string;
  name: string;
  tier: "fast" | "standard";
}

export interface AIProvider {
  id: "anthropic" | "openai";
  name: string;
  defaultModel: string;
  models: AIModel[];
}

export interface AICompletionRequest {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  context?: string;
  selectedText?: string;
  mode: "inline" | "side_panel" | "freeform";
  provider: "anthropic" | "openai";
  model?: string;
}
