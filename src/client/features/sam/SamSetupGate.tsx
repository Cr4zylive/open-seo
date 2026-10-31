import { Link } from "@tanstack/react-router";
import { ShieldAlert, Wrench } from "lucide-react";
import { GateCard } from "@/client/components/GateCard";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";

export function SamSetupGate({
  errorMessage,
  isRefetching,
  onRetry,
}: {
  errorMessage: string | null;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  return (
    <GateCard
      icon={Wrench}
      tone="warning"
      title="启用 AI 功能"
      description={
        <>
          {isEveryAppClientAuthMode() ? (
            <p>
              SAM 是 OpenSEO 的应用内 AI 智能体，通过你的 Every App
              网关使用 OpenRouter。管理员在 OpenRouter 创建密钥后，用{" "}
              <code>pnpm everyapp secret set OPENROUTER_API_KEY</code>{" "}
              设置到网关，然后在这里确认。
            </p>
          ) : (
            <p>
              SAM 是 OpenSEO 的应用内 AI 智能体，需要 OpenRouter API 密钥。在
              OpenRouter 创建密钥，设为{" "}
              <code>OPENROUTER_API_KEY</code>{" "}
              环境变量，重启 OpenSEO，然后在这里确认。
            </p>
          )}
          <p className="text-xs">
            各部署方式的分步说明见{" "}
            <Link
              className="underline underline-offset-2 hover:text-foreground"
              to="/help/openrouter-api-key"
            >
              OpenRouter API 密钥设置指南
            </Link>
            。
          </p>
        </>
      }
      actions={
        <>
          <Button size="lg" pending={isRefetching} onClick={onRetry}>
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
            打开 OpenRouter 密钥
          </Button>
        </>
      }
    >
      {errorMessage ? (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertDescription className="text-foreground">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
    </GateCard>
  );
}
