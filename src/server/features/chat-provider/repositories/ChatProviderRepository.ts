import { eq } from "drizzle-orm";
import { db } from "@/db";
import { chatProviderSettings } from "@/db/schema";
import type { SavedChatProviderSettings } from "@/shared/chat-provider";

const ROW_ID = "default";

function toSaved(row: {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}): SavedChatProviderSettings {
  return {
    baseUrl: row.baseUrl,
    apiKey: row.apiKey,
    modelId: row.modelId,
  };
}

export const ChatProviderRepository = {
  async get(): Promise<SavedChatProviderSettings | null> {
    const rows = await db
      .select({
        baseUrl: chatProviderSettings.baseUrl,
        apiKey: chatProviderSettings.apiKey,
        modelId: chatProviderSettings.modelId,
      })
      .from(chatProviderSettings)
      .where(eq(chatProviderSettings.id, ROW_ID))
      .limit(1);
    const row = rows[0];
    return row ? toSaved(row) : null;
  },

  async save(values: SavedChatProviderSettings): Promise<void> {
    const updatedAt = new Date().toISOString();
    await db
      .insert(chatProviderSettings)
      .values({ id: ROW_ID, ...values, updatedAt })
      .onConflictDoUpdate({
        target: chatProviderSettings.id,
        set: { ...values, updatedAt },
      });
  },
};
