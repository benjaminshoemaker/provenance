import { auth } from "@/auth";
import { resolveProviderModel } from "@/lib/ai/resolve-provider-model";
import { readJsonBody, ReadJsonBodyError } from "@/lib/api/read-json-body";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

type ResponseResult = { response: Response };

export async function requireSessionUserId(): Promise<string | Response> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return userId;
}

export async function parseAiRequestBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  maxBytes: number,
  schema: TSchema
): Promise<{ data: z.infer<TSchema> } | ResponseResult> {
  let body: unknown;
  try {
    body = await readJsonBody(req, maxBytes);
  } catch (error) {
    if (error instanceof ReadJsonBodyError) {
      return {
        response: Response.json(
          { error: error.message },
          { status: error.status }
        ),
      };
    }
    throw error;
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      response: Response.json(
        { error: "Invalid request", issues: parsed.error.issues },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

interface RequestedProviderModel {
  provider?: string;
  model?: string;
}

export async function resolveProviderModelForUser(
  userId: string,
  requested: RequestedProviderModel
): Promise<{ provider: string; model?: string } | ResponseResult> {
  const needsUserPrefs = !requested.provider || !requested.model;
  let userRow:
    | {
        aiProvider: string | null;
        aiModel: string | null;
      }
    | undefined;

  if (needsUserPrefs) {
    [userRow] = await db
      .select({ aiProvider: users.aiProvider, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, userId));
  }

  const providerModel = resolveProviderModel({
    requestedProvider: requested.provider,
    requestedModel: requested.model,
    storedProvider: userRow?.aiProvider,
    storedModel: userRow?.aiModel,
  });

  if (providerModel.invalidRequestedModel) {
    return {
      response: Response.json(
        { error: "Invalid model for provider" },
        { status: 400 }
      ),
    };
  }

  return {
    provider: providerModel.provider,
    model: providerModel.model,
  };
}

export function contentFilterMetadata(part: {
  type: string;
  finishReason?: string;
}) {
  if (part.type === "finish" && part.finishReason === "content-filter") {
    return {
      blocked: true,
      reason: "Content filtered by AI provider",
    };
  }

  return undefined;
}
