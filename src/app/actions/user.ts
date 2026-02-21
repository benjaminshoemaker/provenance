"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/authorize";
import { eq } from "drizzle-orm";
import { providers } from "@/lib/ai/providers";

function validateProviderModel(providerId: string, modelId: string): boolean {
  const provider = providers[providerId];
  if (!provider) return false;
  return provider.models.some((m) => m.id === modelId);
}

export async function updateUserPreferences(data: {
  aiProvider: string;
  aiModel: string;
}) {
  const user = await requireAuth();

  if (!validateProviderModel(data.aiProvider, data.aiModel)) {
    throw new Error("Invalid provider/model combination");
  }

  const [updated] = await db
    .update(users)
    .set({
      aiProvider: data.aiProvider,
      aiModel: data.aiModel,
    })
    .where(eq(users.id, user.id!))
    .returning();

  return updated;
}

export async function getUserPreferences() {
  const user = await requireAuth();

  const [result] = await db
    .select({
      aiProvider: users.aiProvider,
      aiModel: users.aiModel,
    })
    .from(users)
    .where(eq(users.id, user.id!));

  return result ?? { aiProvider: "anthropic", aiModel: null };
}
