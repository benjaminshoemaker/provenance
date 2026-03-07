import { z } from "zod";

const MAX_MESSAGE_BYTES = 25_000;
const MAX_MESSAGE_PARTS = 200;

function isWithinMessageByteBudget(value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) return true;
    return new TextEncoder().encode(serialized).length <= MAX_MESSAGE_BYTES;
  } catch {
    return false;
  }
}

const messagePartSchema = z
  .object({
    type: z.string().max(64),
    text: z.string().max(20_000).optional(),
  })
  .passthrough();

const chatMessageSchema = z
  .object({
    id: z.string().max(256).optional(),
    role: z.enum(["user", "assistant", "system", "tool"]),
    content: z
      .union([z.string().max(20_000), z.array(messagePartSchema).max(MAX_MESSAGE_PARTS)])
      .optional(),
    parts: z.array(messagePartSchema).max(MAX_MESSAGE_PARTS).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!isWithinMessageByteBudget(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message payload too large",
      });
    }
  });

const completionMessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system", "tool"]),
    content: z
      .union([z.string().max(20_000), z.array(messagePartSchema).max(MAX_MESSAGE_PARTS)])
      .optional(),
    parts: z.array(messagePartSchema).max(MAX_MESSAGE_PARTS).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!isWithinMessageByteBudget(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message payload too large",
      });
    }
  });

export const chatRequestSchema = z.object({
  provider: z.enum(["anthropic", "openai"]).optional(),
  model: z.string().max(100).optional(),
  messages: z.array(chatMessageSchema).min(1).max(100),
  documentContext: z.string().max(50_000).optional(),
  threadId: z.string().uuid().optional(),
});

export const aiCompletionSchema = z
  .object({
    mode: z.enum(["inline", "side_panel", "freeform"]),
    provider: z.enum(["anthropic", "openai"]).optional(),
    model: z.string().max(100).optional(),
    prompt: z.string().max(10_000).optional(),
    selectedText: z.string().max(10_000).optional(),
    context: z.string().max(100_000).optional(),
    messages: z.array(completionMessageSchema).max(50).optional(),
  })
  .refine((data) => data.prompt || (data.messages && data.messages.length > 0), {
    message: "Either prompt or messages must be provided",
  });
