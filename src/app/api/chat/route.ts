import { streamText, smoothStream, convertToModelMessages } from "ai";
import { auth } from "@/auth";
import { getModel, isValidModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { chatRequestSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, documentContext } = parsed.data;
  let provider = parsed.data.provider;
  let model = parsed.data.model;

  // Read user's aiProvider preference as fallback
  if (!provider) {
    const [userRow] = await db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, session.user.id));
    provider = (userRow?.aiProvider as "anthropic" | "openai") || "anthropic";
    if (!model) model = userRow?.aiModel || undefined;
  }

  if (model && !isValidModel(provider, model)) {
    return Response.json(
      { error: "Invalid model for provider" },
      { status: 400 }
    );
  }

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: await convertToModelMessages(messages as any),
      experimental_transform: smoothStream({ chunking: "word" }),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageMetadata: ({ part }: any) => {
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
