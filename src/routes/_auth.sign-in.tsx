import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const signInSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址。"),
  password: z.string().min(1, "请输入密码。"),
});

export const Route = createFileRoute("/_auth/sign-in")({
  validateSearch: authRedirectSearchSchema,
  component: SignInPage,
});

function SignInPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { redirectTo, oauthQuery, isHostedMode, isBetterAuthMode } =
    useAuthPageState(search.redirect);
  const [showEmailForm, setShowEmailForm] = useState(false);
  // The standalone Docker edition has accounts but no Google sign-in and no
  // emailed password reset: go straight to the email form. Accounts come from
  // invitations, and a fresh installation has nobody to sign in, so its first
  // visitor is sent to create the admin account instead.
  const emailOnly = isBetterAuthMode && !isHostedMode;
  const emailFormVisible = showEmailForm || emailOnly;
  const google = useGoogleAuth({ redirectTo });
  const signUpStatus = useQuery({
    ...signUpStatusQueryOptions(),
    enabled: emailOnly,
  });
  const firstAccount = signUpStatus.data?.firstAccount === true;
  useEffect(() => {
    if (!firstAccount) return;
    void navigate({
      to: "/sign-up",
      search: getSignInSearch(redirectTo),
      replace: true,
    });
  }, [firstAccount, navigate, redirectTo]);

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ formApi, value }) => {
      try {
        const email = value.email.trim();
        captureClientEvent("auth:sign_in_submit", {
          redirect_to: redirectTo,
        });

        const result = await authClient.signIn.email({
          email,
          password: value.password,
          callbackURL: toAuthCallbackURL(redirectTo),
          ...(oauthQuery ? { oauth_query: oauthQuery } : {}),
        });

        if (!result.error) {
          captureClientEvent("auth:sign_in_success", {
            redirect_to: redirectTo,
          });
          return;
        }

        if (result.error.status === 403) {
          captureClientEvent("auth:sign_in_block_unverified", {
            redirect_to: redirectTo,
          });
          // Email not verified yet: send them to the verification page (which
          // shows "check your inbox" + resend) instead of leaving them on a
          // sign-in form that will keep rejecting them.
          void navigate({
            to: "/verify-email",
            search: getVerifyEmailSearch(email, redirectTo),
          });
          return;
        }

        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message || "无法登录。",
            fields: {},
          },
        });
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: "暂时无法登录，请重试。",
            fields: {},
          },
        });
      }
    },
  });

  return (
    <AuthPageCard
      title="登录"
      footer={
        emailOnly ? (
          <p className="text-sm text-foreground/50">
            需要账户？请向管理员索取邀请。忘记密码？请让服务器管理员重置。
          </p>
        ) : isHostedMode ? (
          <div
            className={
              showEmailForm
                ? "flex w-full justify-between text-sm text-foreground/50"
                : "w-full text-sm text-foreground/50"
            }
          >
            {showEmailForm ? (
              <Link
                to="/forgot-password"
                search={getSignInSearch(redirectTo)}
                className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
              >
                忘记密码？
              </Link>
            ) : null}
            <Link
              to="/sign-up"
              search={getSignInSearch(redirectTo)}
              className="text-foreground underline underline-offset-2 hover:text-foreground/80 transition-colors"
            >
              创建账户
            </Link>
          </div>
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
            <TermsAgreementNotice action="使用 Google 继续" />
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
                  autoComplete="current-password"
                  required
                />
              )}
            </form.AppField>

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
                    >
                      {isSubmitting ? "正在登录…" : "登录"}
                    </Button>
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
