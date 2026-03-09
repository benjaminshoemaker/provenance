import { streamText, convertToModelMessages } from "ai";
import { getModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { aiCompletionSchema } from "@/lib/ai/schemas";
import {
  contentFilterMetadata,
  parseAiRequestBody,
  requireSessionUserId,
  resolveProviderModelForUser,
} from "@/lib/ai/route-utils";

export const maxDuration = 30;
const MAX_COMPLETE_BODY_BYTES = 300_000;

function buildMessageSystemPrompt(basePrompt: string, context?: string) {
  return context ? `${basePrompt}\n\nDocument context:\n${context}` : basePrompt;
}

function buildSinglePrompt(
  prompt: string,
  selectedText?: string,
  context?: string
) {
  const selectedInstruction = selectedText
    ? `Selected text: "${selectedText}"\n\nInstruction: ${prompt}`
    : prompt;
  return context
    ? `Document context:\n${context}\n\n${selectedInstruction}`
    : selectedInstruction;
}

function toUiStreamResponse(result: Awaited<ReturnType<typeof streamText>>) {
  return result.toUIMessageStreamResponse({
    messageMetadata: ({
      part,
    }: {
      part: { type: string; finishReason?: string };
    }) => contentFilterMetadata(part),
  });
}

async function streamConversationCompletion(params: {
  aiModel: ReturnType<typeof getModel>;
  systemPrompt: string;
  context?: string;
  messages: Parameters<typeof convertToModelMessages>[0];
}) {
  const result = streamText({
    model: params.aiModel,
    system: buildMessageSystemPrompt(params.systemPrompt, params.context),
    messages: await convertToModelMessages(params.messages),
  });

  return toUiStreamResponse(result);
}

async function streamSinglePromptCompletion(params: {
  aiModel: ReturnType<typeof getModel>;
  systemPrompt: string;
  prompt: string;
  selectedText?: string;
  context?: string;
}) {
  const result = streamText({
    model: params.aiModel,
    system: params.systemPrompt,
    prompt: buildSinglePrompt(params.prompt, params.selectedText, params.context),
  });

  return toUiStreamResponse(result);
}

export async function POST(req: Request) {
  const userId = await requireSessionUserId();
  if (userId instanceof Response) {
    return userId;
  }

  const parsed = await parseAiRequestBody(
    req,
    MAX_COMPLETE_BODY_BYTES,
    aiCompletionSchema
  );
  if ("response" in parsed) {
    return parsed.response;
  }

  const { messages, prompt, context, selectedText, mode, provider, model } =
    parsed.data;

  const providerModel = await resolveProviderModelForUser(userId, {
    provider,
    model,
  });
  if ("response" in providerModel) {
    return providerModel.response;
  }
  const resolvedProvider = providerModel.provider;
  const resolvedModel = providerModel.model;

  // Rate limit check (database-backed, serverless-safe)
  const { allowed } = await checkRateLimit(userId);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Max 20 requests per minute." },
      { status: 429 }
    );
  }

  const systemPrompt = getSystemPrompt(mode);
  const aiModel = getModel(resolvedProvider, resolvedModel);

  try {
    if (messages) {
      return streamConversationCompletion({
        aiModel,
        systemPrompt,
        context,
        messages: messages as Parameters<typeof convertToModelMessages>[0],
      });
    }

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    return streamSinglePromptCompletion({
      aiModel,
      systemPrompt,
      prompt,
      selectedText,
      context,
    });
  } catch (error) {
    console.error("[AI Complete] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
