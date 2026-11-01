import type { LanguageModelV3 } from "@openrouter/ai-sdk-provider";
import { isEveryAppAuthMode } from "@/lib/auth-mode";
import {
  buildChatAgentModel,
  buildChatAgentModelFromResolved,
  getOpenRouterAccess,
} from "@/server/lib/openrouter";
import { getEnvValueSync, getWorkersEnv } from "@/server/lib/runtime-env";
import { resolveRuntimeChatProvider } from "./ChatProviderService";

/**
 * Resolves saved Chat settings first, then keeps the Every App gateway and
 * legacy OpenRouter environment configuration as fallbacks.
 */
export async function requireChatAgentModel(
  reasoningEffort: "max" | "low" = "max",
): Promise<LanguageModelV3> {
  const env = (await getWorkersEnv()) ?? {};
  const resolved = await resolveRuntimeChatProvider(env);
  if (resolved.apiKey || resolved.baseUrl) {
    return buildChatAgentModelFromResolved(resolved, reasoningEffort);
  }

  const access = getOpenRouterAccess(env);
  if (access) {
    return buildChatAgentModel(access, resolved.modelId, reasoningEffort);
  }

  if (isEveryAppAuthMode(getEnvValueSync(env, "AUTH_MODE"))) {
    throw new Error(
      "AI provider is unavailable. Configure the Every App gateway or Chat settings.",
    );
  }
  throw new Error(
    "尚未配置聊天模型。请在设置中填写 Chat Base URL、聊天 API Key 和模型 id。",
  );
}
