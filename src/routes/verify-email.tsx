import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import { Spinner } from "@/client/components/ui/spinner";
import {
  AuthPageCard,
  AuthPageShell,
  authRedirectSearchSchema,
} from "@/client/features/auth/AuthPage";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient, useSession } from "@/lib/auth-client";
import {
  isEmailVerificationBypassed,
  isHostedClientAuthMode,
} from "@/lib/auth-mode";
import { getSignInSearch, normalizeAuthRedirect } from "@/lib/auth-redirect";
import { z } from "zod";

const verificationIssueSchema = z
  .enum(["invalid_token", "token_expired", "user_not_found", "unknown"])
  .catch("unknown");

const verifyEmailSearchSchema = authRedirectSearchSchema.extend({
  error: z.string().optional(),
  email: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailPage,
});

function getVerificationErrorMessage(error: string | undefined) {
  switch ((error ?? "").toLowerCase()) {
    case "invalid_token":
      return "此链接已失效。请重新申请邮件以继续。";
    case "token_expired":
      return "此链接已过期。请重新申请邮件以继续。";
    case "user_not_found":
      return "找不到此账户。请尝试重新创建。";
    default:
      return error
        ? "无法确认此邮箱。请重新申请邮件后再试。"
        : null;
  }
}

function getVerifyEmailPageCopy({
  isHostedMode,
  errorMessage,
  isPending,
  isRedirecting,
  email,
}: {
  isHostedMode: boolean;
  errorMessage: string | null;
  isPending: boolean;
  isRedirecting: boolean;
  email: string | undefined;
}) {
  if (!isHostedMode) {
    return {
      title: "验证邮箱",
      helperText: "邮箱确认暂时不可用。",
    };
  }

  if (errorMessage) {
    return {
      title: "无法确认你的邮箱",
      helperText: undefined,
    };
  }

  if (isRedirecting) {
    return {
      title: "邮箱已确认",
      helperText: "都好了。正在带你进入账户。",
    };
  }

  if (isPending) {
    return {
      title: "验证邮箱",
      helperText: "正在检查邮箱确认状态。",
    };
  }

  // Default: the user just signed up (or reloaded this page) and still needs to
  // click the verification link. There is never a sign-in CTA here — an
  // unverified hosted user would be bounced straight back by the verification
  // gate.
  return {
    title: "验证你的邮箱",
    helperText: email
      ? `点击我们发到 ${email} 的链接以验证邮箱。`
      : "请查看收件箱中的验证链接。",
  };
}

function VerifyEmailPage() {
  const search = Route.useSearch();
  const redirectTo = normalizeAuthRedirect(search.redirect);
  const isHostedMode = isHostedClientAuthMode();
  const { data: session, isPending } = useSession();
  const bypassEmailVerification = isEmailVerificationBypassed();
  const errorMessage = getVerificationErrorMessage(search.error);
  const verificationIssueType = search.error
    ? verificationIssueSchema.parse(search.error)
    : null;
  const email = search.email ?? session?.user?.email;
  const isVerified = !!session?.user?.emailVerified;
  const [isResending, setIsResending] = useState(false);
  // Verified (or bypass) users are sent on to the app by the effect below; until
  // that lands we show the redirecting state instead of the resend prompt.
  const isRedirecting =
    isVerified || (bypassEmailVerification && Boolean(session?.user?.id));
  const pageCopy = getVerifyEmailPageCopy({
    isHostedMode,
    errorMessage,
    isPending,
    isRedirecting,
    email,
  });

  useEffect(() => {
    if (
      isPending ||
      (!isVerified && !(bypassEmailVerification && session?.user?.id))
    ) {
      return;
    }

    if (isVerified) {
      captureClientEvent("auth:verification_success", {
        redirect_to: redirectTo,
      });
    }

    // Full page reload instead of client-side navigation: the auth→app
    // transition needs a clean server-side load so that all server function
    // handlers are freshly registered (client-side nav during Vite HMR can
    // hit the server before updated handlers are ready, causing
    // "action is not a function" errors).
    window.location.replace(redirectTo);
  }, [
    bypassEmailVerification,
    isPending,
    isVerified,
    redirectTo,
    session?.user?.id,
  ]);

  useEffect(() => {
    if (!verificationIssueType) {
      return;
    }

    captureClientEvent("auth:verification_issue", {
      issue_type: verificationIssueType,
    });
  }, [verificationIssueType]);

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    try {
      const callbackURL = new URL("/verify-email", window.location.origin);
      if (redirectTo !== "/")
        callbackURL.searchParams.set("redirect", redirectTo);
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: callbackURL.toString(),
      });
      if (result.error) {
        toast.error(result.error.message || "无法再发送一封邮件。");
        return;
      }
      captureClientEvent("auth:verification_resend");
      toast.success("新邮件已在路上。");
    } catch {
      toast.error("暂时无法再发送邮件，请重试。");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthPageShell>
      <AuthPageCard
        title={pageCopy.title}
        helperText={pageCopy.helperText}
        footer={
          <p className="text-sm">
            <Link
              to="/sign-in"
              search={getSignInSearch(redirectTo)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              返回登录
            </Link>
          </p>
        }
      >
        {!isHostedMode ? null : errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : isPending || isRedirecting ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : email ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            pending={isResending}
            onClick={() => void handleResend()}
          >
            {isResending ? "正在发送邮件…" : "重新发送邮件"}
          </Button>
        ) : null}
      </AuthPageCard>
    </AuthPageShell>
  );
}
