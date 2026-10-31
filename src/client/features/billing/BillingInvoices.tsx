import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { QueryError } from "@/client/components/QueryState";
import { buttonVariants } from "@/client/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/client/components/ui/field";
import { Skeleton } from "@/client/components/ui/skeleton";
import { Switch } from "@/client/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { billingAccountQueryOptions } from "@/client/features/billing/billingAccountQuery";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import { queryClient } from "@/client/tanstack-db";
import {
  listBillingInvoices,
  setInvoiceEmails,
} from "@/serverFunctions/billing";

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString(undefined, dateFormat);
}

function formatAmount(total: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(total);
}

const invoicesQueryOptions = queryOptions({
  queryKey: ["billing", "invoices"],
  queryFn: () => listBillingInvoices(),
});

/** Invoice emails and the newest invoices, the billing Invoices tab.
 *  Owner-only at the call site, as the server enforces: invoices show the
 *  billing address. */
export function BillingInvoices({
  invoiceEmailsEnabled,
}: {
  invoiceEmailsEnabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <InvoiceEmailsToggle invoiceEmailsEnabled={invoiceEmailsEnabled} />
      <InvoiceTable />
    </div>
  );
}

function InvoiceEmailsToggle({
  invoiceEmailsEnabled,
}: {
  invoiceEmailsEnabled: boolean;
}) {
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => setInvoiceEmails({ data: { enabled } }),
    // The error shows inline under the switch.
    meta: { errorToast: false },
    onSuccess: (_, enabled) => {
      queryClient.setQueryData(billingAccountQueryOptions().queryKey, (prev) =>
        prev ? { ...prev, invoiceEmailsEnabled: enabled } : prev,
      );
    },
  });

  const checked = mutation.isPending
    ? mutation.variables
    : invoiceEmailsEnabled;

  return (
    <Field>
      <div className="flex items-center gap-2">
        <Switch
          id="billing-invoice-emails"
          checked={checked}
          disabled={mutation.isPending}
          onCheckedChange={(enabled) => mutation.mutate(enabled)}
        />
        <FieldLabel htmlFor="billing-invoice-emails">
          每张发票发一封收据邮件给我
        </FieldLabel>
      </div>
      <FieldDescription>
        每次付款后，Stripe 会把收据发到账户的账单邮箱。
      </FieldDescription>
      {mutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {getStandardErrorMessage(
            mutation.error,
            "无法保存此设置，请重试。",
          )}
        </p>
      ) : null}
    </Field>
  );
}

function InvoiceTable() {
  const invoicesQuery = useQuery(invoicesQueryOptions);

  if (invoicesQuery.isPending) {
    return (
      <div aria-busy className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (invoicesQuery.isError) {
    return (
      <QueryError
        error={invoicesQuery.error}
        fallback="无法加载发票，请重试。"
        onRetry={() => void invoicesQuery.refetch()}
        isRetrying={invoicesQuery.isFetching}
      />
    );
  }

  const { invoices, hasMore } = invoicesQuery.data;

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">还没有发票。</p>;
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>发票</TableHead>
            <TableHead>日期</TableHead>
            <TableHead>账期</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>
              <span className="sr-only">下载</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.number ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(invoice.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {invoice.periodStart !== null && invoice.periodEnd !== null
                  ? `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`
                  : "—"}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatAmount(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell>
                {invoice.status === "paid"
                  ? "已支付"
                  : invoice.status === "open"
                    ? "未结"
                    : invoice.status === "draft"
                      ? "草稿"
                      : invoice.status === "void"
                        ? "已作废"
                        : invoice.status === "uncollectible"
                          ? "无法收回"
                          : invoice.status}
              </TableCell>
              <TableCell className="text-right">
                {invoice.pdfUrl ? (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    aria-label={`下载 ${invoice.number ?? "发票"} PDF`}
                  >
                    <Download />
                    PDF
                  </a>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMore ? (
        <p className="text-xs text-muted-foreground">
          正在显示最近的发票。更早的发票可在「管理订阅」中查看。
        </p>
      ) : null}
    </div>
  );
}
