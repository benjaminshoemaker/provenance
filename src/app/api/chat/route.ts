import { streamText, smoothStream, convertToModelMessages } from "ai";
import { getModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { chatRequestSchema } from "@/lib/ai/schemas";
import {
  parseAiRequestBody,
  requireSessionUserId,
  resolveProviderModelForUser,
} from "@/lib/ai/route-utils";

export const maxDuration = 60;
const MAX_CHAT_BODY_BYTES = 400_000;

function buildChatSystemPrompt(documentContext?: string) {
  const systemPrompt = getSystemPrompt("chat");
  if (!documentContext) {
    return systemPrompt;
  }
  return `${systemPrompt}\n\n---\nWriter's document:\n${documentContext}\n---`;
}

function buildChatMetadata(
  part: { type: string; finishReason?: string; usage?: { totalTokens?: number } },
  provider: string,
  model?: string
) {
  if (part.type !== "finish") {
    return undefined;
  }

  return {
    provider,
    model: model ?? "",
    blocked: part.finishReason === "content-filter",
    ...(part.usage ? { tokenCount: part.usage.totalTokens } : {}),
  };
}

export async function POST(req: Request) {
  const userId = await requireSessionUserId();
  if (userId instanceof Response) {
    return userId;
  }

  const parsed = await parseAiRequestBody(req, MAX_CHAT_BODY_BYTES, chatRequestSchema);
  if ("response" in parsed) {
    return parsed.response;
  }

  const { messages, documentContext } = parsed.data;
  const providerModel = await resolveProviderModelForUser(userId, {
    provider: parsed.data.provider,
    model: parsed.data.model,
  });
  if ("response" in providerModel) {
    return providerModel.response;
  }
  const { provider, model } = providerModel;

  const { allowed } = await checkRateLimit(userId);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Max 20 requests per minute." },
      { status: 429 }
    );
  }

  const system = buildChatSystemPrompt(documentContext);
  const aiModel = getModel(provider, model);

  try {
    const result = streamText({
      model: aiModel,
      system,
      messages: await convertToModelMessages(
        messages as Parameters<typeof convertToModelMessages>[0]
      ),
      experimental_transform: smoothStream({ chunking: "word" }),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: false,
      messageMetadata: ({
        part,
      }: {
        part: { type: string; finishReason?: string; usage?: { totalTokens?: number } };
      }) => buildChatMetadata(part, provider, model),
    });
  } catch (error) {
    console.error("[Chat] Error:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
