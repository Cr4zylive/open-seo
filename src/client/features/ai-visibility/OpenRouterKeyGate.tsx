import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { GateCard } from "@/client/components/GateCard";
import { QueryError } from "@/client/components/QueryState";
import { SkeletonPageContent } from "@/client/components/SkeletonPresets";
import { Button } from "@/client/components/ui/button";
import { useSamAccess } from "@/client/features/sam/useSamAccess";

/**
 * AI visibility setup researches the brand and suggests prompts through
 * OpenRouter, so a self-hosted install without a key would only fail after
 * the user starts research. Ask for the key first (hosted always has one).
 */
export function OpenRouterKeyGate({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const access = useSamAccess(projectId);
  if (access.status === "ready") return children;
  if (access.status === "checking") return <SkeletonPageContent />;
  if (access.status === "error")
    return (
      <QueryError
        error={access.error}
        fallback="无法检查 OpenRouter API 密钥。"
        onRetry={access.onRetry}
        isRetrying={access.isRetrying}
      />
    );
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center">
      <GateCard
        className="max-w-2xl"
        icon={KeyRound}
        tone="warning"
        title="添加 OpenRouter API 密钥"
        description={
          <>
            <p>
              AI 可见度通过 OpenRouter 研究你的品牌并建议值得追踪的提示词，你不必自己写。追踪结果——ChatGPT 和其他 AI 引擎的实际回答——来自你的 DataForSEO 账户。
            </p>
            <p>
              在 OpenRouter 创建密钥，设置为{" "}
              <code>OPENROUTER_API_KEY</code>，重启 OpenSEO，然后回到这里确认。{" "}
              <Link
                className="underline underline-offset-2 hover:text-foreground"
                to="/help/openrouter-api-key"
              >
                OpenRouter API 密钥设置指南
              </Link>{" "}
              提供了各部署方式的步骤。
            </p>
          </>
        }
        actions={
          <>
            <Button
              size="lg"
              pending={access.isRefetching}
              onClick={access.onRetry}
            >
              确认 API 密钥
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href="https://openrouter.ai/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              打开 OpenRouter 密钥页
            </Button>
          </>
        }
      />
    </div>
  );
}
