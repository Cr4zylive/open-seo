import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/client/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/client/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/client/components/ui/input-group";
import {
  AutoReloadNotice,
  UpdateCardButton,
} from "@/client/features/billing/AutoReloadNotice";
import { BillingRow } from "@/client/features/billing/BillingRow";
import { billingAccountQueryOptions } from "@/client/features/billing/billingAccountQuery";
import { parseUsdAmount } from "@/client/features/billing/HostedBillingContentUtils";
import { useCreditBalance } from "@/client/features/billing/useCreditBalance";
import {
  getErrorCode,
  getStandardErrorMessage,
} from "@/client/lib/error-messages";
import { queryClient } from "@/client/tanstack-db";
import { setAutoReload } from "@/serverFunctions/billing";
import {
  AUTO_RELOAD_DEFAULTS,
  AUTO_RELOAD_MAX_MONTHLY_USD,
  AUTO_RELOAD_THRESHOLD_USD,
  isAutoReloadBudgetSpent,
  TOP_UP_MAX_USD,
  TOP_UP_MIN_USD,
  type AutoReloadSettings as AutoReloadValues,
} from "@/shared/billing";

type AutoReload = NonNullable<
  ReturnType<typeof useCreditBalance>["autoReload"]
>;

/**
 * The auto-reload row of the billing summary. Collapsed, it says what is set
 * and offers Turn on or Edit; the amounts open only when asked for. Turning
 * on can charge the first reload right away (the server buys it before
 * enabling); the button says so. A failed reload or a spent budget shows a
 * notice even while collapsed, the latter with a one-click raise.
 * Owner-only at the call site, as the server enforces.
 */
export function AutoReloadSettings() {
  const {
    topUpRemaining,
    refillDate,
    autoReload: saved,
    autoReloadState,
    autoReloadPrimesOnEnable: chargesNow,
  } = useCreditBalance();
  // The saved control while it is on; null when off or never set up.
  const on = saved?.enabled ? saved : null;

  const savedFields = () => ({
    amountUsd: String(saved?.amountUsd ?? AUTO_RELOAD_DEFAULTS.amountUsd),
    monthlyLimitUsd: String(
      saved?.monthlyLimitUsd ?? AUTO_RELOAD_DEFAULTS.monthlyLimitUsd,
    ),
  });
  const [editing, setEditing] = useState(false);
  const [fields, setFields] =
    useState<Record<keyof AutoReloadValues, string>>(savedFields);

  const amount = parseUsdAmount(fields.amountUsd, {
    fallback: saved?.amountUsd ?? AUTO_RELOAD_DEFAULTS.amountUsd,
  });
  const budget = parseUsdAmount(fields.monthlyLimitUsd, {
    min: amount.parsed,
    max: AUTO_RELOAD_MAX_MONTHLY_USD,
    fallback: saved?.monthlyLimitUsd ?? AUTO_RELOAD_DEFAULTS.monthlyLimitUsd,
  });
  const values: AutoReloadValues = {
    amountUsd: amount.parsed,
    monthlyLimitUsd: budget.parsed,
  };
  const isValid = amount.isValid && budget.isValid;
  const isDirty =
    !on ||
    on.amountUsd !== values.amountUsd ||
    on.monthlyLimitUsd !== values.monthlyLimitUsd;
  // The server decides whether saving buys the first reload now (also the
  // retry after a failed one), and the page shows that same decision.
  const budgetUnderSpend = isBudgetUnderSpend(saved, values.monthlyLimitUsd);
  const canSubmit = isValid && !budgetUnderSpend;
  const hint = hintCopy({
    saved,
    on,
    values,
    isValid,
    chargesNow,
    topUpRemaining,
  });

  const mutation = useMutation({
    mutationFn: (
      input: { enabled: false } | ({ enabled: true } & AutoReloadValues),
    ) => setAutoReload({ data: input }),
    // Errors show inline, with the portal when the card is the problem.
    meta: { errorToast: false },
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({
        queryKey: billingAccountQueryOptions().queryKey,
      });
      setEditing(false);
      toast.success(input.enabled ? "自动续充已开启" : "自动续充已关闭");
    },
  });
  const saving = mutation.isPending && Boolean(mutation.variables?.enabled);
  const turningOff = mutation.isPending && !saving;

  const save = (next: AutoReloadValues) => {
    setFields({
      amountUsd: String(next.amountUsd),
      monthlyLimitUsd: String(next.monthlyLimitUsd),
    });
    mutation.mutate({ enabled: true, ...next });
  };

  const openForm = () => {
    setFields(savedFields());
    mutation.reset();
    setEditing(true);
  };

  const saveLabel = chargesNow
    ? `${on ? "重试" : "开启"}并立即购买 $${values.amountUsd}`
    : on
      ? "保存"
      : "开启自动续充";

  const notice = saved ? (
    <AutoReloadNotice
      saved={saved}
      state={autoReloadState}
      canRetry={chargesNow}
      resetDate={refillDate}
      // The raise is the plain save; when saving would charge the card,
      // the form's button says so and is the way to do it.
      onRaise={
        on && !chargesNow
          ? (monthlyLimitUsd) =>
              save({ amountUsd: on.amountUsd, monthlyLimitUsd })
          : undefined
      }
      pending={mutation.isPending}
    />
  ) : null;

  return (
    <BillingRow
      label="自动续充"
      summary={
        on ? (
          <>
            <span className="font-medium text-foreground">开</span> &middot;
            额外点数降到 ${AUTO_RELOAD_THRESHOLD_USD} 时加 $
            {on.amountUsd} &middot; 本月预算已用 ${on.spentUsd.toFixed(2)} / $
            {on.monthlyLimitUsd}
            {refillDate ? `，${refillDate} 重置` : ""}
          </>
        ) : (
          <>
            关 &middot; 额外点数降到 ${AUTO_RELOAD_THRESHOLD_USD}{" "}
            时自动购买
          </>
        )
      }
      action={
        editing ? null : (
          <Button variant="outline" size="sm" onClick={openForm}>
            {!on ? "开启" : chargesNow ? "重试" : "编辑"}
          </Button>
        )
      }
    >
      {notice}
      {editing ? (
        <div className="max-w-xl space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <AmountField
              id="auto-reload-amount"
              label="每次加额"
              value={fields.amountUsd}
              error={
                amount.isValid
                  ? undefined
                  : `请输入 $${TOP_UP_MIN_USD}–$${TOP_UP_MAX_USD} 之间的金额。`
              }
              onChange={(value) =>
                setFields((prev) => ({ ...prev, amountUsd: value }))
              }
            />
            <AmountField
              id="auto-reload-budget"
              label="每月预算"
              value={fields.monthlyLimitUsd}
              error={
                budget.isValid
                  ? undefined
                  : `请输入 $${amount.parsed}–$${AUTO_RELOAD_MAX_MONTHLY_USD} 之间的金额。`
              }
              onChange={(value) =>
                setFields((prev) => ({ ...prev, monthlyLimitUsd: value }))
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            预算限制你每月花在额外点数上的金额，包括自己购买的。
          </p>

          {hint ? <p className="text-xs text-amber-600">{hint}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              pending={saving}
              disabled={mutation.isPending || !canSubmit}
              onClick={() =>
                // Nothing to change and nothing to retry: just close.
                isDirty || chargesNow ? save(values) : setEditing(false)
              }
            >
              {saveLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => setEditing(false)}
            >
              取消
            </Button>
            {on ? (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                pending={turningOff}
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ enabled: false })}
              >
                关闭自动续充
              </Button>
            ) : null}
          </div>

          {mutation.isError ? (
            <div className="space-y-2">
              <p role="alert" className="text-sm text-destructive">
                {getStandardErrorMessage(
                  mutation.error,
                  "无法保存自动续充，请重试。",
                )}
              </p>
              {getErrorCode(mutation.error) === "PAYMENT_METHOD_REQUIRED" ? (
                <UpdateCardButton />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </BillingRow>
  );
}

// Autumn keeps the cycle's top-up spend while auto-reload is off, so a
// budget the spend already reaches pauses the credits at once, and a turn-on
// that buys now would buy credits that cannot be used. The server refuses
// it; the page says so first.
function isBudgetUnderSpend(saved: AutoReload | null, monthlyLimitUsd: number) {
  return (
    saved !== null &&
    saved.spentUsd > 0 &&
    isAutoReloadBudgetSpent(saved.spentUsd, monthlyLimitUsd)
  );
}

/** The amber line under the fields: a budget the spend has reached (unless
 *  the notice above already says it), else what saving charges now. */
function hintCopy({
  saved,
  on,
  values,
  isValid,
  chargesNow,
  topUpRemaining,
}: {
  saved: AutoReload | null;
  on: AutoReload | null;
  values: AutoReloadValues;
  isValid: boolean;
  chargesNow: boolean;
  topUpRemaining: number;
}) {
  if (
    saved &&
    isBudgetUnderSpend(saved, values.monthlyLimitUsd) &&
    (!on || values.monthlyLimitUsd !== on.monthlyLimitUsd)
  ) {
    return `本月已在额外点数上花了 $${saved.spentUsd.toFixed(2)}。预算至少设为 $${Math.ceil(saved.spentUsd + AUTO_RELOAD_THRESHOLD_USD)} 才能继续。`;
  }
  if (!chargesNow || !isValid) return null;
  if (on) {
    return `重试会立刻从银行卡扣 $${values.amountUsd}。`;
  }
  if (topUpRemaining > 0) {
    return `额外点数余额已有 $${topUpRemaining.toFixed(2)}，开启后会立刻购买 $${values.amountUsd}。`;
  }
  return `你还没有额外点数，开启后会立刻购买 $${values.amountUsd}。每月点数用完后才会用到它们。`;
}

function AmountField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={error !== undefined}>
      <FieldLabel htmlFor={id} className="text-xs">
        {label}
      </FieldLabel>
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput
          id={id}
          type="number"
          step={1}
          inputMode="numeric"
          aria-invalid={error !== undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </InputGroup>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
