import { isValidModel } from "./providers";

export type SupportedProvider = "anthropic" | "openai";

interface ResolveProviderModelInput {
  requestedProvider?: string;
  requestedModel?: string;
  storedProvider?: string | null;
  storedModel?: string | null;
}

interface ResolveProviderModelResult {
  provider: SupportedProvider;
  model?: string;
  invalidRequestedModel: boolean;
}

function normalizeProvider(value: string | null | undefined): SupportedProvider | null {
  if (value === "anthropic" || value === "openai") return value;
  return null;
}

function normalizeModel(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveProviderModel(
  input: ResolveProviderModelInput
): ResolveProviderModelResult {
  const requestedProvider = normalizeProvider(input.requestedProvider);
  const storedProvider = normalizeProvider(input.storedProvider);
  const provider = requestedProvider ?? storedProvider ?? "anthropic";

  const requestedModel = normalizeModel(input.requestedModel);
  if (requestedModel) {
    if (!isValidModel(provider, requestedModel)) {
      return { provider, invalidRequestedModel: true };
    }
    return {
      provider,
      model: requestedModel,
      invalidRequestedModel: false,
    };
  }

  const storedModel = normalizeModel(input.storedModel);
  if (storedModel && isValidModel(provider, storedModel)) {
    return {
      provider,
      model: storedModel,
      invalidRequestedModel: false,
    };
  }

  return {
    provider,
    model: undefined,
    invalidRequestedModel: false,
  };
}
