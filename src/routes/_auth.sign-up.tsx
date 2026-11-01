import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageLoading } from "@/client/components/Spinner";
import { useAppForm } from "@/client/components/form/useAppForm";
import { Button } from "@/client/components/ui/button";
import {
  AuthPageCard,
  AuthMethodChooser,
  TermsAgreementNotice,
  authInputClassName,
  authSubmitClassName,
  authRedirectSearchSchema,
  useAuthPageState,
} from "@/client/features/auth/AuthPage";
import {
  TURNSTILE_SITE_KEY,
  TurnstileWidget,
  useTurnstileCaptcha,
} from "@/client/features/auth/TurnstileWidget";
import { passwordSchema } from "@/client/features/auth/passwordSchema";
import { signUpStatusQueryOptions } from "@/client/features/auth/signUpStatus";
import { useGoogleAuth } from "@/client/features/auth/useGoogleAuth";
import { getFormError } from "@/client/lib/forms";
import { captureClientEvent } from "@/client/lib/posthog";
import { authClient } from "@/lib/auth-client";
import {
  getSignInSearch,
  getVerifyEmailSearch,
  toAuthCallbackURL,
} from "@/lib/auth-redirect";
import { z } from "zod";

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

const signUpSchema = z
  .object({
    email: z.string().trim().email("请输入有效的邮箱地址。"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致。",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/_auth/sign-up")({
  validateSearch: authRedirectSearchSchema.extend({
    // A site checked with the marketing site's free tool; onboarding
    // prefills it, and the website step validates it on save.
    domain: z.string().optional().catch(undefined),
    // An ad's campaign tags, which the marketing site's landing pages carry
    // onto the sign-up link. Passed on through the post-signup redirect so the
    // server can save the campaign on the new account.
    utm_source: z.string().optional().catch(undefined),
    utm_medium: z.string().optional().catch(undefined),
    utm_campaign: z.string().optional().catch(undefined),
    utm_content: z.string().optional().catch(undefined),
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { redirectTo, isHostedMode, isBetterAuthMode } = useAuthPageState(
    search.redirect,
  );
  const onboardingSearch = new URLSearchParams();
  if (search.domain) onboardingSearch.set("domain", search.domain);
  for (const name of UTM_PARAMS) {
    const value = search[name];
    if (value) onboardingSearch.set(name, value);
  }
  const postSignupRedirect =
    redirectTo !== "/"
      ? redirectTo
      : onboardingSearch.size > 0
        ? `/onboarding?${onboardingSearch.toString()}`
        : "/onboarding";
  const [showEmailForm, setShowEmailForm] = useState(false);
  const google = useGoogleAuth({ redirectTo, postSignupRedirect });
  // The standalone Docker edition: no Google, no email verification, and the
  // server accepts a sign-up only for the first account or an invited address
  // (src/server/standalone/sign-up.ts).
  const standalone = isBetterAuthMode && !isHostedMode;
  const invited = redirectTo.startsWith("/accept-invitation/");
  const signUpStatus = useQuery({
    ...signUpStatusQueryOptions(),
    enabled: standalone,
  });
  const firstAccount = signUpStatus.data?.firstAccount === true;
  const emailFormVisible = showEmailForm || standalone;

  // Turnstile is active only in hosted mode with a configured site key.
  const isTurnstileEnabled = isHostedMode && Boolean(TURNSTILE_SITE_KEY);
  const captcha = useTurnstileCaptcha();

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ formApi, value }) => {
      const captchaToken = captcha.tokenRef.current;
      try {
        const email = value.email.trim();
        captureClientEvent("auth:sign_up_submit", {
          redirect_to: redirectTo,
        });
        const verificationCallbackURL = new URL(
          "/verify-email",
          window.location.origin,
        );
        const verificationSearch = getVerifyEmailSearch(
          undefined,
          postSignupRedirect,
        );
        if (verificationSearch.redirect) {
          verificationCallbackURL.searchParams.set(
            "redirect",
            verificationSearch.redirect,
          );
        }
        const result = await authClient.signUp.email({
          name: email.split("@")[0] || "OpenSEO User",
          email,
          password: value.password,
          callbackURL: verificationCallbackURL.toString(),
          ...(isTurnstileEnabled && captchaToken
            ? {
                fetchOptions: {
                  headers: { "x-captcha-response": captchaToken },
                },
              }
            : {}),
        });

        if (result.error) {
          // Turnstile tokens are single-use; re-challenge so a retry can succeed.
          if (isTurnstileEnabled) captcha.reset();
          formApi.setErrorMap({
            onSubmit: {
              form: result.error.message || "无法创建账户。",
              fields: {},
            },
          });
          return;
        }

        captureClientEvent("auth:sign_up_success", {
          redirect_to: redirectTo,
        });
        if (standalone) {
          // Nothing to verify here, and autoSignIn is off so the operator's
          // create-user never mints a session: sign in explicitly, and the
          // layout sends the new session to redirectTo.
          const signedIn = await authClient.signIn.email({
            email,
            password: value.password,
            callbackURL: toAuthCallbackURL(redirectTo),
          });
          if (signedIn.error) {
            formApi.setErrorMap({
              onSubmit: {
                form:
                  signedIn.error.message ||
                  "账户已创建。请登录以继续。",
                fields: {},
              },
            });
          }
          return;
        }
        void navigate({
          to: "/verify-email",
          search: getVerifyEmailSearch(email, postSignupRedirect),
          replace: true,
        });
      } catch {
        if (isTurnstileEnabled) captcha.reset();
        formApi.setErrorMap({
          onSubmit: {
            form: "暂时无法创建账户，请重试。",
            fields: {},
          },
        });
      }
    },
  });

  if (standalone && !firstAccount && !invited) {
    if (signUpStatus.isPending) return <PageLoading />;
    return (
      <AuthPageCard
        title="注册已关闭"
        helperText="请向管理员索取邀请。"
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
        {null}
      </AuthPageCard>
    );
  }

  return (
    <AuthPageCard
      title={firstAccount ? "创建管理员账户" : "创建账户"}
      helperText={
        firstAccount
          ? "此安装还没有账户。第一个账户会成为管理员。"
          : invited
            ? "请使用收到邀请的邮箱地址。"
            : undefined
      }
      footer={
        standalone ? (
          firstAccount ? null : (
            <p className="text-sm text-foreground/50">
              已有账户？{" "}
              <Link
                to="/sign-in"
                search={getSignInSearch(redirectTo)}
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                登录
              </Link>
            </p>
          )
        ) : isHostedMode ? (
          showEmailForm ? (
            <button
              type="button"
              className="text-sm text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              onClick={() => {
                setShowEmailForm(false);
                google.clearError();
              }}
            >
              返回注册
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-foreground/50">
                已有账户？{" "}
                <Link
                  to="/sign-in"
                  search={getSignInSearch(redirectTo)}
                  className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
                >
                  登录
                </Link>
              </p>
            </div>
          )
        ) : null
      }
    >
      {!emailFormVisible ? (
        <>
          <AuthMethodChooser
            googleLabel="使用 Google 继续"
            disabled={!isHostedMode}
            isBusy={google.isStarting}
            onContinueWithGoogle={() => {
              void google.start();
            }}
            onContinueWithEmail={() => {
              setShowEmailForm(true);
              google.clearError();
            }}
          />
          {isHostedMode ? (
            <TermsAgreementNotice action="继续" />
          ) : null}
          {google.error ? (
            <p className="text-sm text-destructive">{google.error}</p>
          ) : null}
        </>
      ) : (
        <form.AppForm>
          <form.Form className="space-y-4">
            <form.AppField name="email">
              {(field) => (
                <field.TextField
                  label="邮箱地址"
                  hideLabel
                  className={authInputClassName}
                  type="email"
                  placeholder="邮箱地址…"
                  autoComplete="email"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="password">
              {(field) => (
                <field.TextField
                  label="密码"
                  hideLabel
                  className={authInputClassName}
                  type="password"
                  placeholder="密码…"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>
            <form.AppField name="confirmPassword">
              {(field) => (
                <field.TextField
                  label="确认密码"
                  hideLabel
                  className={authInputClassName}
                  type="password"
                  placeholder="确认密码…"
                  autoComplete="new-password"
                  required
                />
              )}
            </form.AppField>

            {isTurnstileEnabled ? (
              <TurnstileWidget
                onToken={captcha.onToken}
                resetNonce={captcha.resetNonce}
              />
            ) : null}

            <form.Subscribe
              selector={(state) => ({
                submitError: state.errorMap.onSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ submitError, isSubmitting }) => {
                const errorMessage = getFormError(submitError);
                return (
                  <>
                    {errorMessage ? (
                      <p className="text-sm text-destructive">{errorMessage}</p>
                    ) : null}
                    <Button
                      type="submit"
                      variant="secondary"
                      className={authSubmitClassName}
                      pending={isSubmitting}
                      disabled={isTurnstileEnabled && !captcha.hasToken}
                    >
                      {isSubmitting ? "正在创建账户…" : "创建账户"}
                    </Button>
                    {isHostedMode ? (
                      <TermsAgreementNotice action="创建账户" />
                    ) : null}
                  </>
                );
              }}
            </form.Subscribe>
          </form.Form>
        </form.AppForm>
      )}
    </AuthPageCard>
  );
}
