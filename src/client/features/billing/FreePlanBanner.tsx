import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { AppBanner } from "@/client/layout/AppBanner";
import { BASE_PLAN_OFFER } from "@/client/features/billing/plan-offers";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import { captureClientEvent } from "@/client/lib/posthog";
import { useCanManageBilling } from "@/client/features/team/organizationQueries";
import { BILLING_ROUTE, SUBSCRIBE_ROUTE } from "@/shared/billing";

export function FreePlanBanner() {
  const {
    accountQuery,
    isFreePlan,
    isOutOfCredits,
    isLowCredits,
    refillDate,
    autoReload,
    autoReloadState,
    isPausedByBudget,
  } = useCreditBalance();
  const canManageBilling = useCanManageBilling();
  const showsOutOfCredits = Boolean(accountQuery.data) && isOutOfCredits;

  useEffect(() => {
    if (showsOutOfCredits)
      captureClientEvent("billing:out_of_credits_shown", { surface: "banner" });
  }, [showsOutOfCredits]);

  if (!accountQuery.data) {
    return null;
  }

  // Credits may be in the balance, but the budget holds them back; buying
  // more would not help, only raising it does.
  if (isPausedByBudget && autoReload) {
    const until = refillDate ? `，直到 ${refillDate}` : "";
    return (
      <AppBanner variant="warning">
        {canManageBilling ? (
          <>
            已达到每月 ${autoReload.monthlyLimitUsd}{" "}
            的自动续充预算，点数已暂停{until}。{" "}
            <Link
              to={BILLING_ROUTE}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              提高预算
            </Link>{" "}
            即可继续。
          </>
        ) : (
          <>
            组织已达到每月自动续充预算，点数已暂停{until}
            。请让所有者提高预算。
          </>
        )}
      </AppBanner>
    );
  }

  // Out of credits with auto-reload on and working means Autumn is charging
  // the card right now; a "buy more" notice would have them pay twice.
  if (!isFreePlan && isOutOfCredits && autoReloadState === "on" && autoReload) {
    return (
      <AppBanner variant="info">
        点数已用完。自动续充正在加 $
        {autoReload.amountUsd}。
      </AppBanner>
    );
  }

  // Only the owner can change the plan or buy credits, so a link would lead
  // everyone else to a page where they can't act.
  if (!canManageBilling && (isOutOfCredits || isLowCredits)) {
    return (
      <AppBanner variant={isOutOfCredits ? "destructive" : "warning"}>
        {isOutOfCredits
          ? autoReloadState === "card_failed"
            ? "组织点数已用完，银行卡被拒。"
            : "组织点数已用完。"
          : "组织点数快用完了。"}{" "}
        请让组织所有者
        {autoReloadState === "card_failed" ? "更新银行卡" : "补充点数"}。
      </AppBanner>
    );
  }

  const creditsActionLink = isFreePlan ? (
    <Link
      to={SUBSCRIBE_ROUTE}
      search={{ upgrade: true }}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      升级套餐
    </Link>
  ) : (
    <Link
      to={BILLING_ROUTE}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      购买更多点数
    </Link>
  );

  if (isOutOfCredits) {
    return (
      <AppBanner variant="destructive">
        {isFreePlan ? (
          <>
            免费点数已用完。{creditsActionLink}，每月获得 $
            {BASE_PLAN_OFFER.monthlyCreditsUsd} 点数。
          </>
        ) : autoReloadState === "card_failed" ? (
          <>
            点数已用完，自动续充无法从银行卡扣款。{" "}
            <Link
              to={BILLING_ROUTE}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              更新银行卡
            </Link>{" "}
            即可继续。
          </>
        ) : autoReloadState === "failed" ? (
          <>
            点数已用完，自动续充无法再购买。{creditsActionLink}
            即可继续。
          </>
        ) : (
          <>
            本月点数已用完。{creditsActionLink}即可继续
            {refillDate ? `，或等到 ${refillDate} 重置` : ""}。
          </>
        )}
      </AppBanner>
    );
  }

  if (isLowCredits) {
    return (
      <AppBanner variant="warning">
        点数快用完了。{creditsActionLink}以继续使用 OpenSEO。
      </AppBanner>
    );
  }

  if (isFreePlan) {
    return (
      <AppBanner variant="info">
        希望你喜欢 OpenSEO！随时{" "}
        <Link
          to={SUBSCRIBE_ROUTE}
          search={{ upgrade: true }}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          升级
        </Link>{" "}
        ，或{" "}
        <Link
          to="/support"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          有问题就联系我们
        </Link>
        .
      </AppBanner>
    );
  }

  return null;
}
