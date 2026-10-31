import { useEffect, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import {
  getErrorCode,
  getStandardErrorMessage,
} from "@/client/lib/error-messages";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { getClientAuthMode, usesBetterAuthClient } from "@/lib/auth-mode";
import { getSignInHref, getSignInHrefForLocation } from "@/lib/auth-redirect";

const CLOUDFLARE_SETUP_GUIDE_URL =
  "https://github.com/every-app/open-seo/blob/main/docs/SELF_HOSTING_CLOUDFLARE.md#2-configure-authentication-and-secrets";

type CardProps = {
  message: string;
  onRetry: () => void;
};

/**
 * The card for an auth failure, else `fallback`. The route error boundary and
 * the landing redirect both render errors through this, so each auth error
 * code shows the same card everywhere.
 */
export function AuthErrorCard({
  error,
  onRetry,
  fallback,
}: {
  error: unknown;
  onRetry: () => void;
  fallback: ReactNode;
}) {
  const errorCode = getErrorCode(error);
  if (errorCode !== "AUTH_CONFIG_MISSING" && errorCode !== "UNAUTHENTICATED") {
    return fallback;
  }

  const message = getStandardErrorMessage(
    error,
    "出现问题，请重试。",
  );
  return (
    <div className="flex h-full min-w-0 flex-1 items-center justify-center p-4">
      {errorCode === "AUTH_CONFIG_MISSING" ? (
        <AuthConfigErrorCard message={message} onRetry={onRetry} />
      ) : (
        <UnauthenticatedErrorCard message={message} onRetry={onRetry} />
      )}
    </div>
  );
}

function AuthConfigErrorCard({ message, onRetry }: CardProps) {
  // The hint names the settings of the mode the server actually runs; the
  // alert above already carries the server's exact message.
  const clientAuthMode = getClientAuthMode();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-destructive" />
          需要配置身份验证
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>

        {clientAuthMode === "hosted" ? (
          <p className="text-muted-foreground">
            托管模式需要在部署环境中设置{" "}
            <code className="mx-1">BETTER_AUTH_SECRET</code>
            （至少 32 个字符）、<code className="mx-1">BETTER_AUTH_URL</code> 和
            Google OAuth 凭据。
          </p>
        ) : null}
        {clientAuthMode === "everyapp" ? (
          <p className="text-muted-foreground">
            OpenSEO 运行在 Every App 网关之后，由网关负责登录。请用{" "}
            <code className="mx-1">pnpm everyapp install</code>{" "}
            安装以获取网关身份密钥，并通过网关打开。
          </p>
        ) : null}
        {clientAuthMode === "cloudflare_access" ? (
          <p className="text-muted-foreground">
            Cloudflare Access 模式需要在部署环境中设置
            <code className="mx-1">TEAM_DOMAIN</code>（完整 HTTPS 地址）和
            <code className="mx-1">POLICY_AUD</code>，并使用 Access
            应用保护此主机名。
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" onClick={onRetry}>
          重试
        </Button>
        <Button
          nativeButton={false}
          render={
            <a
              href={CLOUDFLARE_SETUP_GUIDE_URL}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          打开设置指南
        </Button>
      </CardFooter>
    </Card>
  );
}

function UnauthenticatedErrorCard({ message, onRetry }: CardProps) {
  // A sign-in page exists wherever Better Auth accounts do.
  const hasSignIn = usesBetterAuthClient();
  const signInHref =
    typeof window === "undefined"
      ? getSignInHref("/")
      : getSignInHrefForLocation(window.location);

  useEffect(() => {
    if (typeof window === "undefined" || !hasSignIn) {
      return;
    }

    window.location.replace(signInHref);
  }, [hasSignIn, signInHref]);

  if (hasSignIn) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>需要身份验证</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p>{message}</p>
        <p>此部署使用外部身份验证。请刷新访问会话后重试。</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onRetry}>重试</Button>
      </CardFooter>
    </Card>
  );
}
