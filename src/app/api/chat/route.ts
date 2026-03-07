import { streamText, smoothStream, convertToModelMessages } from "ai";
import { auth } from "@/auth";
import { getModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { resolveProviderModel } from "@/lib/ai/resolve-provider-model";
import { chatRequestSchema } from "@/lib/ai/schemas";
import { readJsonBody, ReadJsonBodyError } from "@/lib/api/read-json-body";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;
const MAX_CHAT_BODY_BYTES = 400_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(req, MAX_CHAT_BODY_BYTES);
  } catch (error) {
    if (error instanceof ReadJsonBodyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, documentContext } = parsed.data;
  const needsUserPrefs = !parsed.data.provider || !parsed.data.model;
  let userRow:
    | { aiProvider: string | null; aiModel: string | null }
    | undefined;

  if (needsUserPrefs) {
    [userRow] = await db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, session.user.id));
  }

  const providerModel = resolveProviderModel({
    requestedProvider: parsed.data.provider,
    requestedModel: parsed.data.model,
    storedProvider: userRow?.aiProvider,
    storedModel: userRow?.aiModel,
  });

  if (providerModel.invalidRequestedModel) {
    return Response.json(
      { error: "Invalid model for provider" },
      { status: 400 }
    );
  }
  const { provider, model } = providerModel;

  const { allowed } = await checkRateLimit(session.user.id);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Max 20 requests per minute." },
      { status: 429 }
    );
  }

  let system = getSystemPrompt("chat");
  if (documentContext) {
    system += "\n\n---\nWriter's document:\n" + documentContext + "\n---";
  }

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
      }) => {
        if (part.type === "finish") {
          return {
            provider,
            model,
            blocked: part.finishReason === "content-filter",
            ...(part.usage ? { tokenCount: part.usage.totalTokens } : {}),
          };
        }
      },
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
