import { ChatProviderRepository } from "@/server/features/chat-provider/repositories/ChatProviderRepository";
import {
  getEnvValueSync,
  getOptionalEnvValue,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";
import {
  nextChatProviderRow,
  resolveChatProvider,
  type ChatProviderEnvFallback,
  type ResolvedChatProvider,
} from "@/shared/chat-provider";

export type ChatProviderFormState = {
  baseUrl: string;
  modelId: string;
  apiKeyConfigured: boolean;
  saved: boolean;
};

async function envFallback(env: object): Promise<ChatProviderEnvFallback> {
  const read = async (name: string) =>
    getEnvValueSync(env, name) ?? (await getOptionalEnvValue(name));
  return {
    chatBaseUrl: await read("CHAT_BASE_URL"),
    openRouterBaseUrl: await read("OPENROUTER_BASE_URL"),
    apiKey: await read("OPENROUTER_API_KEY"),
    modelId: await read("OPENROUTER_MODEL"),
  };
}

export async function resolveRuntimeChatProvider(
  env: object,
): Promise<ResolvedChatProvider> {
  const saved = await ChatProviderRepository.get();
  return resolveChatProvider(saved, await envFallback(env));
}

export async function getChatProviderFormState(
  env: object,
): Promise<ChatProviderFormState> {
  const saved = await ChatProviderRepository.get();
  const resolved = resolveChatProvider(saved, await envFallback(env));
  return {
    baseUrl: saved?.baseUrl ?? "",
    modelId: saved?.modelId ?? "",
    apiKeyConfigured: Boolean(resolved.apiKey),
    saved: saved !== null,
  };
}

export async function saveChatProviderSettings(input: {
  baseUrl: string;
  apiKey: string;
  modelId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (await isHostedServerAuthMode()) {
    return { ok: false, message: "托管部署的聊天模型由平台配置。" };
  }

  const next = nextChatProviderRow(await ChatProviderRepository.get(), input);
  if (!next.ok) return next;

  await ChatProviderRepository.save({
    baseUrl: next.baseUrl,
    apiKey: next.apiKey,
    modelId: next.modelId,
  });
  return { ok: true };
}
