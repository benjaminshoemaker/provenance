import { streamText, convertToModelMessages } from "ai";
import { auth } from "@/auth";
import { getModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";
import { checkRateLimit } from "@/lib/ai/rate-limit";
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
  const { messages, prompt, context, selectedText, mode } = body;
  let { provider, model } = body;

  // Read user's aiProvider preference as fallback
  if (!provider) {
    const [userRow] = await db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, session.user.id));
    provider = userRow?.aiProvider || "anthropic";
    if (!model) model = userRow?.aiModel || undefined;
  }

  if (!mode || !provider) {
    return Response.json(
      { error: "Missing required fields: mode, provider" },
      { status: 400 }
    );
  }

  if (!prompt && (!messages || messages.length === 0)) {
    return Response.json(
      { error: "Missing prompt or messages" },
      { status: 400 }
    );
  }

  if (!["inline", "side_panel", "freeform"].includes(mode)) {
    return Response.json({ error: "Invalid mode" }, { status: 400 });
  }

  if (!["anthropic", "openai"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }

  // Validate model against allowlist if specified
  if (model) {
    const { providers } = await import("@/lib/ai/providers");
    const providerConfig = providers[provider];
    if (providerConfig && !providerConfig.models.some((m) => m.id === model)) {
      return Response.json({ error: "Invalid model for provider" }, { status: 400 });
    }
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

  // Build streamText options based on input type
  if (messages) {
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
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
  let fullPrompt = prompt;
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
}
