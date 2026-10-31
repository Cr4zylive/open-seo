import { selectChatBaseUrl } from "@/shared/chat-base-url";

// Saved in chat_provider_settings. A missing row means "nothing saved yet"
// and the env fallback applies. A present row owns the base URL: empty means
// OpenRouter, even if CHAT_BASE_URL is still set in the environment.
export type SavedChatProviderSettings = {
  baseUrl: string;
  apiKey: string;
  modelId: string;
};

export type ChatProviderEnvFallback = {
  chatBaseUrl?: string;
  openRouterBaseUrl?: string;
  apiKey?: string;
  modelId?: string;
};

export type ResolvedChatProvider = {
  baseUrl?: string;
  apiKey?: string;
  modelId?: string;
};

export function resolveChatProvider(
  saved: SavedChatProviderSettings | null,
  env: ChatProviderEnvFallback,
): ResolvedChatProvider {
  const envBaseUrl = selectChatBaseUrl(env.chatBaseUrl, env.openRouterBaseUrl);
  const envKey = env.apiKey?.trim() || undefined;
  const envModel = env.modelId?.trim() || undefined;

  if (!saved) {
    return { baseUrl: envBaseUrl, apiKey: envKey, modelId: envModel };
  }

  const savedKey = saved.apiKey.trim();
  const savedModel = saved.modelId.trim();
  return {
    baseUrl: saved.baseUrl.trim() || undefined,
    apiKey: savedKey || envKey,
    modelId: savedModel || envModel,
  };
}

export function parseChatBaseUrl(
  value: string,
): { ok: true; baseUrl: string } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, baseUrl: "" };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      ok: false,
      message: "Chat Base URL 需要是完整地址，例如 https://api.ooapi.cc/v1",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      message: "Chat Base URL 需要以 http:// 或 https:// 开头",
    };
  }
  if (url.username || url.password || url.search || url.hash) {
    return {
      ok: false,
      message: "Chat Base URL 只写到 /v1，密钥请填在聊天 API Key",
    };
  }

  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!path.endsWith("/v1")) {
    return {
      ok: false,
      message: "Chat Base URL 需要以 /v1 结尾，例如 https://api.ooapi.cc/v1",
    };
  }

  return { ok: true, baseUrl: `${url.origin}${path}` };
}

// Blank API key keeps the previously saved key. A first save with a blank
// key stores "" so the env key can still fill in until one is typed.
export function nextChatProviderRow(
  existing: SavedChatProviderSettings | null,
  input: { baseUrl: string; apiKey: string; modelId: string },
):
  | { ok: true; baseUrl: string; apiKey: string; modelId: string }
  | { ok: false; message: string } {
  const parsed = parseChatBaseUrl(input.baseUrl);
  if (!parsed.ok) return parsed;

  const modelId = input.modelId.trim();
  if (modelId.length > 200) {
    return { ok: false, message: "模型 id 过长" };
  }

  return {
    ok: true,
    baseUrl: parsed.baseUrl,
    apiKey: input.apiKey.trim() || existing?.apiKey || "",
    modelId,
  };
}
