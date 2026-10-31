import {
  createOpenRouter,
  type LanguageModelV3,
} from "@openrouter/ai-sdk-provider";
import { getEnvValueSync } from "@/server/lib/runtime-env";
import {
  resolveChatProvider,
  type ResolvedChatProvider,
} from "@/shared/chat-provider";

// OpenRouter model slug used when no model id has been saved in chat settings
// and OPENROUTER_MODEL is unset. A saved model id, or that env var before the
// first save, is what gets sent to the endpoint.
const DEFAULT_CHAT_AGENT_MODEL = "openai/gpt-5.6-luna";

// Previous default; kept reachable via OPENROUTER_MODEL for rollback. Its
// routing needs the ZDR/provider tuning below — OpenRouter only.
const MINIMAX_M3 = "minimax/minimax-m3";

// createOpenRouter refuses an empty apiKey. Local OpenAI-compatible servers
// usually ignore Authorization, so a custom base URL with no
// OPENROUTER_API_KEY still gets a bearer they can discard.
const CUSTOM_ENDPOINT_BEARER_FALLBACK = "local";

/**
 * Returns the AI SDK LanguageModel for the chat agent.
 *
 * OpenRouter (no custom base URL): `usage: { include: true }` turns on usage
 * accounting so each response carries its real USD cost
 * (providerMetadata.openrouter.usage.cost), which we meter against the shared
 * usage-credit pool. Default model is GPT-5.6 Luna at `reasoning.effort:
 * "max"` — "max" is valid at the OpenRouter API for GPT-5.x but missing from
 * the SDK's effort union, so the reasoning config rides in `extraBody`.
 *
 * Custom base URL: the same provider is pointed at that OpenAI-compatible
 * `/v1` origin (`POST {baseURL}/chat/completions`) with `compatibility:
 * "compatible"`. Usage accounting, provider order/ZDR/fallbacks, and the
 * OpenRouter reasoning channel are omitted — a generic gateway does not
 * honor them, and cost metering reads as 0 because no OpenRouter usage cost
 * comes back. The bearer is the chat API key. The model id is whatever was
 * saved (or the env fallback before the first save).
 *
 * Sync on purpose: Think's `getModel()` hook is sync and runs on every turn,
 * so the SAM agent reads the key/model from its DO env and builds here.
 */
export function buildChatAgentModel(
  apiKey: string,
  modelId?: string,
  reasoningEffort: "max" | "low" = "max",
  baseURL?: string,
): LanguageModelV3 {
  const model = modelId ?? DEFAULT_CHAT_AGENT_MODEL;
  const endpoint = baseURL?.trim();
  if (endpoint) {
    const bearer = apiKey.trim() || CUSTOM_ENDPOINT_BEARER_FALLBACK;
    return createOpenRouter({
      apiKey: bearer,
      baseURL: endpoint,
      compatibility: "compatible",
    })(model);
  }

  const openrouter = createOpenRouter({ apiKey });

  // MiniMax M3 (env-override path only): `provider.order` prefers Together,
  // then Atlas Cloud (fp8); `zdr: true` restricts routing to Zero-Data-
  // Retention endpoints, which excludes MiniMax first-party — the account's
  // "Non-frontier requires ZDR" data policy enforces the same, this flag is
  // belt-and-braces. Fallbacks stay on within the ZDR set because pinning
  // providers caused a prod outage (Jul 2026: Together upstream-rate-limited
  // m3 and every chat turn 429'd). The explicit reasoning channel keeps m3's
  // `<think>` trace out of the visible answer text.
  if (model === MINIMAX_M3) {
    return openrouter(model, {
      usage: { include: true },
      reasoning: { effort: reasoningEffort === "low" ? "low" : "medium" },
      provider: {
        order: ["together", "atlas-cloud/fp8"],
        zdr: true,
        allow_fallbacks: true,
      },
    });
  }

  return openrouter(model, {
    usage: { include: true },
    extraBody: { reasoning: { effort: reasoningEffort } },
  });
}

export function buildChatAgentModelFromResolved(
  resolved: ResolvedChatProvider,
  reasoningEffort: "max" | "low" = "max",
): LanguageModelV3 {
  // A custom endpoint can run without a key (the builder sends a placeholder
  // bearer). OpenRouter still requires one.
  if (!resolved.apiKey && !resolved.baseUrl) {
    throw new Error("OPENROUTER_API_KEY is required for the SAM agent");
  }
  return buildChatAgentModel(
    resolved.apiKey ?? "",
    resolved.modelId,
    reasoningEffort,
    resolved.baseUrl,
  );
}

// Env-only view. Used when no chat settings row has been saved yet.
export function buildChatAgentModelFromEnv(
  env: object,
  reasoningEffort: "max" | "low" = "max",
): LanguageModelV3 {
  return buildChatAgentModelFromResolved(
    resolveChatProvider(null, {
      chatBaseUrl: getEnvValueSync(env, "CHAT_BASE_URL"),
      openRouterBaseUrl: getEnvValueSync(env, "OPENROUTER_BASE_URL"),
      apiKey: getEnvValueSync(env, "OPENROUTER_API_KEY"),
      modelId: getEnvValueSync(env, "OPENROUTER_MODEL"),
    }),
    reasoningEffort,
  );
}
