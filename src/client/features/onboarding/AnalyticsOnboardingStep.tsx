import { useMutation } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import { Switch } from "@/client/components/ui/switch";
import {
  updatePrivacyChoices,
  usePrivacyChoices,
} from "@/client/components/PrivacyChoices";
import { WizardFooter } from "@/client/features/onboarding/WizardFooter";
import { useSession } from "@/lib/auth-client";
import { setProductUpdatesOptIn } from "@/serverFunctions/product-updates";
import type { PrivacyChoices } from "@/shared/privacy-choices";
import { PRIVACY_URL } from "@/shared/terms";

/** Onboarding step for usage analytics and product-update emails. Each switch
 *  starts from the current choice, which is the region default until the user
 *  picks. Continue saves both. */
export function AnalyticsOnboardingStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const choices = usePrivacyChoices();
  const { data: session, refetch } = useSession();
  // Unset until the user flips a switch.
  const [analytics, setAnalytics] = React.useState<boolean>();
  const [productUpdates, setProductUpdates] = React.useState<boolean>();

  const save = useMutation({
    // The email choice is only sent when the switch was flipped: signup
    // already applied the region default.
    mutationFn: async (next: {
      privacy: PrivacyChoices;
      productUpdates: boolean | undefined;
    }) => {
      await Promise.all([
        updatePrivacyChoices(next.privacy, true),
        next.productUpdates === undefined
          ? null
          : setProductUpdatesOptIn({ data: { optIn: next.productUpdates } }),
      ]);
      // The session is served from a signed cookie cache, so bypass it for
      // Settings to show the saved email choice.
      await refetch({ query: { disableCookieCache: true } });
    },
    // A failed email sync shouldn't trap anyone in onboarding.
    onError: () =>
      toast.error(
        "无法保存你的邮件偏好。可在设置中更改。",
      ),
    onSettled: onNext,
  });

  if (!choices) return null;
  const analyticsOn = analytics ?? choices.analytics;
  const productUpdatesOn =
    productUpdates ?? session?.user.productUpdatesOptIn === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          帮 OpenSEO 变得更好
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          这些随时可在设置中更改。详见{" "}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            隐私政策
          </a>
          。
        </p>
      </div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">使用分析</p>
          <p className="mt-1 text-sm text-muted-foreground">
            分享使用分析和会话回放，帮助改进 OpenSEO。
          </p>
        </div>
        <Switch
          checked={analyticsOn}
          onCheckedChange={setAnalytics}
          aria-label="分享使用分析"
        />
      </div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">产品更新</p>
          <p className="mt-1 text-sm text-muted-foreground">
            偶尔发送新功能和技巧邮件。随时可取消订阅。
          </p>
        </div>
        <Switch
          checked={productUpdatesOn}
          onCheckedChange={setProductUpdates}
          aria-label="接收产品更新邮件"
        />
      </div>
      <WizardFooter
        onBack={onBack}
        continueAction={
          <Button
            type="button"
            className="font-semibold"
            pending={save.isPending}
            onClick={() =>
              save.mutate({
                privacy: { ...choices, analytics: analyticsOn },
                productUpdates,
              })
            }
          >
            继续
            <ArrowRight className="size-4" />
          </Button>
        }
      />
    </div>
  );
}
