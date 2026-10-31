import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Tag } from "lucide-react";
import { QueryError } from "@/client/components/QueryState";
import { StatusScreen } from "@/client/components/StatusScreen";
import { Button } from "@/client/components/ui/button";
import { Skeleton } from "@/client/components/ui/skeleton";
import {
  billingAccountQueryOptions,
  prefetchBillingAccount,
} from "@/client/features/billing/billingAccountQuery";
import { PlanPageAccountMenu } from "@/client/features/billing/PlanPageAccountMenu";
import {
  PlanGuarantee,
  PlanOfferCard,
} from "@/client/features/billing/PlanOfferCard";
import {
  YC_PLAN_OFFER,
  monthlyCreditsFeature,
} from "@/client/features/billing/plan-offers";
import { openPlanCheckout } from "@/client/features/billing/checkout";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { useSession } from "@/lib/auth-client";
import { isHostedClientAuthMode } from "@/lib/auth-mode";
import { BILLING_ROUTE } from "@/shared/billing";
import { SUPPORT_EMAIL } from "@/client/lib/support";

const PLAN_FEATURES = [
  "关键词研究、反向链接、排名跟踪和网站审计",
  "面向 Claude、Cursor 和 ChatGPT 的 MCP 服务器与智能体技能",
  "Google Search Console 集成",
  monthlyCreditsFeature(YC_PLAN_OFFER),
];

export const Route = createFileRoute("/_authenticated/yc")({
  // The loader fills the module-scoped query client, so keep it out of server
  // requests: one worker isolate must not cache another account's billing.
  ssr: false,
  beforeLoad: () => {
    if (!isHostedClientAuthMode()) {
      throw notFound();
    }
  },
  // Start the billing read alongside the session check, not after it.
  loader: () => prefetchBillingAccount(),
  component: YcPlanPage,
});

function YcPlanPage() {
  const { data: session } = useSession();
  const [isAttaching, setIsAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountQuery = useQuery(billingAccountQueryOptions());
  const account = accountQuery.data;

  // Checkout is owner-only; other members are pointed at their organization
  // owner instead of a button that would 403.
  const canManageBilling = useCanManageBilling();

  const isPaid = account?.planStatus === "paid";
  const isOnYcPlan = account?.paidPlanId === YC_PLAN_OFFER.planId;

  // A failed refetch keeps the loaded page; only a failed first read stops.
  if (accountQuery.isError && !account) {
    return (
      <StatusScreen logo title="账单暂不可用" size="sm">
        <QueryError
          cause={accountQuery.error}
          fallback="暂时无法确认账单状态，请重试。"
          onRetry={() => void accountQuery.refetch()}
          isRetrying={accountQuery.isFetching}
        />
      </StatusScreen>
    );
  }

  async function handleSubscribe() {
    setError(null);
    setIsAttaching(true);

    try {
      // Existing subscribers switching plans land on Billing so they can see
      // the new plan; new subscribers go into the app.
      await openPlanCheckout(
        YC_PLAN_OFFER.planId,
        isPaid ? BILLING_ROUTE : "/",
      );
    } catch (err) {
      setError(
        getStandardErrorMessage(
          err,
          "无法开始结账，请重试。",
        ),
      );
      setIsAttaching(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <PlanPageAccountMenu email={session?.user?.email} />

      <div className="text-center space-y-3">
        <img
          src="/transparent-logo.png"
          alt="OpenSEO"
          className="mx-auto size-10 rounded-lg"
        />
        <h1 className="text-xl font-semibold">面向 YC 创始人的 OpenSEO</h1>
        <p className="text-sm text-muted-foreground">
          给认真做 SEO 的团队更大的每月点数池，通过 YC 优惠首月免费。
        </p>
      </div>

      <PlanOfferCard offer={YC_PLAN_OFFER} features={PLAN_FEATURES}>
        <div className="flex gap-2.5 rounded-md bg-muted p-3 text-sm">
          <Tag className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              别忘了优惠码。
            </span>{" "}
            在结账页的「Add promotion
            code」里输入 YC 优惠码，即可享受首月免费。
          </p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!account ? (
          // The offer is static; only the button depends on the current plan.
          <Skeleton className="h-9 w-full" />
        ) : isOnYcPlan ? (
          <p className="text-sm text-muted-foreground">
            你已经在{YC_PLAN_OFFER.name}上。{" "}
            <Link
              to={BILLING_ROUTE}
              className="underline underline-offset-2 hover:text-foreground"
            >
              在账单中管理
            </Link>
            .
          </p>
        ) : canManageBilling ? (
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="secondary"
              pending={isAttaching}
              onClick={() => void handleSubscribe()}
            >
              {isAttaching
                ? "正在跳转…"
                : isPaid
                  ? `切换到${YC_PLAN_OFFER.name}`
                  : `获取${YC_PLAN_OFFER.name}`}
            </Button>
            {isPaid ? (
              <p className="text-center text-xs text-muted-foreground">
                会替换当前订阅。
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            只有组织所有者可以更改套餐。请让他们把此组织切换到
            {YC_PLAN_OFFER.name}。
          </p>
        )}

        <PlanGuarantee />
      </PlanOfferCard>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          有问题？发邮件到{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href={`mailto:${SUPPORT_EMAIL}`}
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="size-3.5 rotate-180" />
          返回应用
        </Link>
      </div>
    </div>
  );
}
