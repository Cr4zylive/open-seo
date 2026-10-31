import { useEffect, type ReactElement } from "react";
import { Link } from "@tanstack/react-router";
import { ErrorState } from "@/client/components/ErrorState";
import { Button } from "@/client/components/ui/button";
import { BASE_PLAN_OFFER } from "@/client/features/billing/plan-offers";
import { billingAccountQueryOptions } from "@/client/features/billing/billingAccountQuery";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { captureClientEvent } from "@/client/lib/posthog";
import { queryClient } from "@/client/tanstack-db";
import { BILLING_ROUTE, SUBSCRIBE_ROUTE } from "@/shared/billing";

/**
 * An out-of-credits failure that says how to get more: a free plan upgrades,
 * a paid plan buys credits, and until the customer loads the generic copy
 * points at Billing. A retry can't fix it, so there is no retry button.
 *
 * The member role is left to the banner and the billing page: reading it here
 * would pull a server function into every page error (and every test that
 * renders one).
 */
export function InsufficientCreditsError({
  variant,
  title,
}: {
  variant?: "inline" | "card" | "page";
  title?: string;
}) {
  const { message, action } = useCreditsOffer("card");
  return (
    <ErrorState
      variant={variant}
      title={title}
      message={message}
      action={action}
    />
  );
}

/** The card's button alone, for a spot too small for the card. */
export function GetCreditsButton() {
  return useCreditsOffer("button").action;
}

function useCreditsOffer(surface: "card" | "button") {
  const {
    accountQuery,
    isFreePlan,
    isOutOfCredits,
    refillDate,
    autoReload,
    autoReloadState,
  } = useCreditBalance();

  useEffect(() => {
    captureClientEvent("billing:out_of_credits_shown", { surface });
  }, [surface]);

  // The balance the page shows is up to a minute old; a fresh refusal means
  // it moved, and with auto-reload on it is about to move again. The button
  // alone sits on stored skip reasons, one per row, which say nothing new.
  useEffect(() => {
    if (surface !== "card") return;
    void queryClient.invalidateQueries({
      queryKey: billingAccountQueryOptions().queryKey,
    });
  }, [surface]);

  let message: string;
  let action: ReactElement;
  if (!accountQuery.data) {
    message = getStandardErrorMessage(new Error("INSUFFICIENT_CREDITS"));
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="前往账单" />
    );
  } else if (isFreePlan) {
    message = `点数不够完成此操作。升级后每月可获得 $${BASE_PLAN_OFFER.monthlyCreditsUsd} 点数。`;
    action = (
      <CreditsButton
        link={<Link to={SUBSCRIBE_ROUTE} search={{ upgrade: true }} />}
        label="升级套餐"
      />
    );
  } else if (autoReloadState === "on" && isOutOfCredits && autoReload) {
    // The refused call is what told Autumn to reload; the credits are coming.
    // A balance that is not out means this is an old refusal (a scheduled
    // run's stored skip reason), so it gets the general copy below.
    message = `点数已用完。自动续充正在加 $${autoReload.amountUsd}，请稍后再试。`;
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="前往账单" />
    );
  } else if (autoReloadState === "card_failed") {
    message =
      "点数已用完，自动续充无法从银行卡扣款。请更新银行卡以继续。";
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="更新银行卡" />
    );
  } else if (autoReloadState === "failed") {
    message =
      "点数已用完，自动续充无法再购买。请购买点数以继续。";
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="购买点数" />
    );
  } else if (autoReloadState === "budget_spent" && autoReload) {
    // Buying credits would not help: the budget counts those too.
    message = `已达到每月 $${autoReload.monthlyLimitUsd} 的自动续充预算，点数已暂停${refillDate ? `，直到 ${refillDate}` : ""}。提高预算即可继续。`;
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="提高预算" />
    );
  } else {
    message = refillDate
      ? `点数不够完成此操作。可以再买一些，或等到 ${refillDate} 每月重置。下次可由自动续充代买。`
      : "点数不够完成此操作。购买更多点数即可继续。下次可由自动续充代买。";
    action = (
      <CreditsButton link={<Link to={BILLING_ROUTE} />} label="购买点数" />
    );
  }

  return { message, action };
}

function CreditsButton({ link, label }: { link: ReactElement; label: string }) {
  return (
    // Its own text color: a red error around it would otherwise tint it.
    <Button
      variant="outline"
      size="sm"
      className="text-foreground"
      nativeButton={false}
      render={link}
    >
      {label}
    </Button>
  );
}
