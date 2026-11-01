import { Button } from "@/client/components/ui/button";
import type { GooglePickerAccount } from "./GooglePropertyPicker";

export function GscPropertySetupHelp({
  accounts,
  loading,
  busy,
  linking,
  onRetry,
  onReconnect,
}: {
  accounts: GooglePickerAccount[];
  loading: boolean;
  busy: boolean;
  linking: boolean;
  onRetry: () => void;
  onReconnect: () => void;
}) {
  return (
    <>
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <h2 className="font-semibold">没有找到你的网站</h2>
        <p className="break-words text-muted-foreground">
          已检查{" "}
          {accounts
            .map(
              (account) =>
                account.email ??
                `Google 账号 · ${account.accountId.slice(-6)}`,
            )
            .join("、")}
          。
        </p>
        <p className="text-muted-foreground">
          把网站加到 Search Console，或请管理者给
          {accounts.length === 1 ? "此账号" : "其中一个账号"}访问权限。
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            打开 Search Console ↗
          </a>
          <a
            href="https://openseo.so/blogs/google-search-console-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            设置指南
          </a>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={loading || busy}
        >
          {loading ? "正在刷新…" : "刷新"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          disabled={loading || busy}
          pending={linking}
        >
          {linking ? "正在打开 Google…" : "换一个 Google 账号"}
        </Button>
      </div>
    </>
  );
}

export function hasNoGscWebsites(
  accounts: GooglePickerAccount[],
  loading: boolean,
  error: boolean,
) {
  return (
    !loading &&
    !error &&
    accounts.length > 0 &&
    accounts.every(
      (account) =>
        !account.requiresReconnect &&
        !account.unavailable &&
        account.properties.length === 0,
    )
  );
}
