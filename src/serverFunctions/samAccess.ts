import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { selectChatBaseUrl } from "@/shared/chat-base-url";
import {
  getOptionalEnvValue,
  isHostedServerAuthMode,
} from "@/server/lib/runtime-env";
import { requireProjectContext } from "@/serverFunctions/middleware";

const OPENROUTER_KEY_MISSING_MESSAGE =
  "当前部署尚未设置 OPENROUTER_API_KEY，也没有自定义聊天接口（CHAT_BASE_URL）。请配置其一后重启 OpenSEO，再在此确认。";

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

    const baseURL = selectChatBaseUrl(
      await getOptionalEnvValue("CHAT_BASE_URL"),
      await getOptionalEnvValue("OPENROUTER_BASE_URL"),
    );
    const enabled = Boolean(
      (await getOptionalEnvValue("OPENROUTER_API_KEY")) || baseURL,
    );
    return {
      enabled,
      errorMessage: enabled ? null : OPENROUTER_KEY_MISSING_MESSAGE,
    };
  });
