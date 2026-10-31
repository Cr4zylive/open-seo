import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import type { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { SUPPORT_EMAIL } from "@/client/lib/support";
import { createBillingPortalSession } from "@/serverFunctions/billing";
import {
  AUTO_RELOAD_CARD_FAILURE_REASONS,
  AUTO_RELOAD_MAX_MONTHLY_USD,
  BILLING_ROUTE,
} from "@/shared/billing";

type AutoReload = NonNullable<
  ReturnType<typeof useCreditBalance>["autoReload"]
>;
type AutoReloadState = ReturnType<typeof useCreditBalance>["autoReloadState"];

// What the one-click raise adds once the cycle's budget is spent.
const BUDGET_RAISE_STEP_USD = 50;

// Why a reload did not go through, in the customer's terms, for the reasons
// in AUTO_RELOAD_CARD_FAILURE_REASONS. Anything else is ours and gets support.
const CARD_FAILURES: Record<string, string> = {
  charge_failed: "银行卡被拒",
  suspended_after_failures: "银行卡多次被拒",
  missing_payment_method: "账户里没有银行卡",
  payment_method_not_supported:
    "当前支付方式无法自动扣款",
  payment_method_delayed: "当前支付方式到账太慢",
};

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** The last failed reload, or the cycle's budget being spent. */
export function AutoReloadNotice({
  saved,
  state,
  canRetry,
  resetDate,
  onRaise,
  pending,
}: {
  saved: AutoReload;
  state: AutoReloadState;
  /** Whether saving below charges the card again, which is the retry. */
  canRetry: boolean;
  resetDate: string | null;
  /** Saves a higher budget at once; absent when saving would charge the card. */
  onRaise: ((monthlyLimitUsd: number) => void) | undefined;
  pending: boolean;
}) {
  // A failure is news while reloads are expected; off, it is history.
  if (saved.enabled && saved.failure) {
    const isCardFailure = AUTO_RELOAD_CARD_FAILURE_REASONS.has(
      saved.failure.reason,
    );
    return (
      <Alert variant="destructive">
        <AlertDescription className="space-y-2">
          <p>
            {isCardFailure ? (
              <>
                自动续充在 {formatDate(saved.failure.at)} 失败：
                {CARD_FAILURES[saved.failure.reason] ?? "扣款失败"}。{" "}
                {canRetry
                  ? "请更新银行卡后再重试。"
                  : "请更新银行卡，下次点数不足时才能扣款。"}
              </>
            ) : (
              <>
                自动续充暂时不可用。请先在上方购买点数，并邮件联系{" "}
                {SUPPORT_EMAIL}。
              </>
            )}
          </p>
          {isCardFailure ? <UpdateCardButton /> : null}
        </AlertDescription>
      </Alert>
    );
  }
  if (state === "budget_spent") {
    const raised = Math.min(
      saved.monthlyLimitUsd + BUDGET_RAISE_STEP_USD,
      AUTO_RELOAD_MAX_MONTHLY_USD,
    );
    // At the maximum there is nothing to raise; the reset is the way out.
    const canRaise = raised > saved.monthlyLimitUsd;
    return (
      <Alert variant="warning">
        <AlertDescription className="space-y-2">
          <p>
            已达到每月 ${saved.monthlyLimitUsd}{" "}
            的预算，额外点数已暂停
            {resetDate ? `，直到 ${resetDate}` : ""}。
            {canRaise ? " 提高预算即可继续。" : ""}
          </p>
          {onRaise && canRaise ? (
            <Button
              variant="outline"
              size="sm"
              pending={pending}
              disabled={pending}
              onClick={() => onRaise(raised)}
            >
              将预算提高到 ${raised}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

/** Opens the Stripe billing portal, where the card on file is changed. */
export function UpdateCardButton() {
  const [isOpening, setIsOpening] = useState(false);

  async function openPortal() {
    setIsOpening(true);
    try {
      window.location.assign(
        await createBillingPortalSession({ data: { returnTo: BILLING_ROUTE } }),
      );
    } catch (error) {
      setIsOpening(false);
      toast.error(
        getStandardErrorMessage(
          error,
          "无法打开账单门户，请重试。",
        ),
      );
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      pending={isOpening}
      onClick={() => void openPortal()}
    >
      {isOpening ? "正在打开 Stripe…" : "更新银行卡"}
    </Button>
  );
}
