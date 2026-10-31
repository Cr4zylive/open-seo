import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveRuntimeChatProvider } from "@/server/features/chat-provider/services/ChatProviderService";
import { isHostedServerAuthMode } from "@/server/lib/runtime-env";
import { requireProjectContext } from "@/serverFunctions/middleware";

const OPENROUTER_KEY_MISSING_MESSAGE =
  "尚未配置聊天模型。请打开设置，填写聊天 API Key。使用 OpenAI 兼容接口时，再填写 Chat Base URL（需带 /v1，例如 https://api.ooapi.cc/v1）和模型 id，保存后在此确认。";

const projectScopedSchema = z.object({ projectId: z.string().min(1) });

type SamAccessStatus = {
  enabled: boolean;
  errorMessage: string | null;
};

// Gates the in-app AI agent (SAM) on a chat provider being configured: an
// OpenRouter key, or a custom OpenAI-compatible base URL. Hosted deployments
// always have the key provisioned, so only self-hosted is checked.
export const getSamAccessSetupStatus = createServerFn({ method: "GET" })
  .middleware(requireProjectContext)
  .validator(projectScopedSchema)
  .handler(async (): Promise<SamAccessStatus> => {
    if (await isHostedServerAuthMode()) {
      return { enabled: true, errorMessage: null };
    }

    const resolved = await resolveRuntimeChatProvider({});
    const enabled = Boolean(resolved.apiKey || resolved.baseUrl);
    return {
      enabled,
      errorMessage: enabled ? null : OPENROUTER_KEY_MISSING_MESSAGE,
    };
  });
