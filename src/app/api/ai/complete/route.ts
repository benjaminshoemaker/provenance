import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/auth";
import { getModel, isValidModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { aiCompletionSchema } from "@/lib/ai/schemas";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate request body with Zod
  const parsed = aiCompletionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { messages, prompt, context, selectedText, mode } = parsed.data;
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

  // Validate model against allowlist if specified
  if (model && !isValidModel(provider, model)) {
    return Response.json({ error: "Invalid model for provider" }, { status: 400 });
  }

  // Rate limit check (database-backed, serverless-safe)
  const { allowed } = await checkRateLimit(session.user.id);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Max 20 requests per minute." },
      { status: 429 }
    );
  }

  const systemPrompt = getSystemPrompt(mode);
  const aiModel = getModel(provider, model);

  try {
    // Build streamText options based on input type
    if (messages) {
      // Inject document context into system prompt for Side Panel mode
      let system = systemPrompt;
      if (context) {
        system = `${systemPrompt}\n\nDocument context:\n${context}`;
      }

      const result = streamText({
        model: aiModel,
        system,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: await convertToModelMessages(messages as any),
      });

      return result.toUIMessageStreamResponse({
        messageMetadata: ({
          part,
        }: {
          part: { type: string; finishReason?: string };
        }) => {
          if (
            part.type === "finish" &&
            part.finishReason === "content-filter"
          ) {
            return {
              blocked: true,
              reason: "Content filtered by AI provider",
            };
          }
        },
      });
    }

    // Single prompt mode (inline/freeform)
    let fullPrompt = prompt!;
    if (selectedText) {
      fullPrompt = `Selected text: "${selectedText}"\n\nInstruction: ${prompt}`;
    }
    if (context) {
      fullPrompt = `Document context:\n${context}\n\n${fullPrompt}`;
    }

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      prompt: fullPrompt,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({
        part,
      }: {
        part: { type: string; finishReason?: string };
      }) => {
        if (
          part.type === "finish" &&
          part.finishReason === "content-filter"
        ) {
          return {
            blocked: true,
            reason: "Content filtered by AI provider",
          };
        }
      },
    });
  } catch (error) {
    console.error("[AI Complete] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
