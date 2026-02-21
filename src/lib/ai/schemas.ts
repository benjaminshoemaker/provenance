import { z } from "zod";

export const aiCompletionSchema = z
  .object({
    mode: z.enum(["inline", "side_panel", "freeform"]),
    provider: z.enum(["anthropic", "openai"]).optional(),
    model: z.string().max(100).optional(),
    prompt: z.string().max(10_000).optional(),
    selectedText: z.string().max(10_000).optional(),
    context: z.string().max(100_000).optional(),
    messages: z
      .array(
        z.object({
          role: z.string(),
          content: z.union([z.string(), z.array(z.any())]).optional(),
          parts: z.array(z.any()).optional(),
        }).passthrough()
      )
      .max(50)
      .optional(),
  })
  .refine((data) => data.prompt || (data.messages && data.messages.length > 0), {
    message: "Either prompt or messages must be provided",
  });
