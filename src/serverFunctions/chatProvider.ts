import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getChatProviderFormState,
  saveChatProviderSettings,
} from "@/server/features/chat-provider/services/ChatProviderService";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";

const saveSchema = z.object({
  baseUrl: z.string().max(500),
  apiKey: z.string().max(2000),
  modelId: z.string().max(200),
});

export const getChatProviderSettings = createServerFn({ method: "GET" })
  .middleware(requireAuthenticatedContext)
  .handler(async () => getChatProviderFormState({}));

export const saveChatProviderSettingsFn = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .validator(saveSchema)
  .handler(async ({ data }) => saveChatProviderSettings(data));
