import { useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  CrawlerAccessForm,
  CrawlerAccessSetupHint,
  useCrawlerAccessNeedsSetup,
  crawlerCredentialsQueryKey,
  saveCrawlerCredentialMutationKey,
} from "@/client/features/crawler-access/CrawlerAccessForm";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import { Button } from "@/client/components/ui/button";
import { ShopifyRateLimitAlert } from "@/client/features/audit/results/ShopifyRateLimitAlert";
import type { AuditResultsData } from "@/client/features/audit/results/types";
import { extractHostname } from "@/client/features/audit/shared";
import { startAudit } from "@/serverFunctions/audit";
import { listCrawlerCredentials } from "@/serverFunctions/crawlerAccess";
import {
  SHOPIFY_CRAWLER_ACCESS_DOC_URL,
  isCrawlerAccessExpired,
} from "@/shared/crawler-access";

/**
 * Shown instead of the generic crawl warnings when a Shopify storefront
 * throttled or refused the crawl. Shopify's own fix is a crawler-access
 * signature the merchant creates in admin, so the report asks for it first.
 *
 * The setup steps only show while the domain has no usable signature. Once
 * one is saved they collapse to a single line with the re-run button. An
 * unrendered crawl Shopify still rate limited with the signature asks for
 * rendering instead. On Every App, where CRAWLER_ACCESS_SECRET is optional,
 * the warning says to set it first when it isn't: a signature created too
 * early only runs down its expiry.
 */
export function ShopifyCrawlWarning({
  projectId,
  audit,
  throttled,
}: {
  projectId: string;
  audit: AuditResultsData["audit"];
  /** Shopify answered with 429s, not only refusals. */
  throttled: boolean;
}) {
  const navigate = useNavigate();
  const host = extractHostname(audit.startUrl);
  const usedCredentialId = audit.config.crawlerCredentialId;

  const credentialsQuery = useQuery({
    queryKey: crawlerCredentialsQueryKey,
    queryFn: () => listCrawlerCredentials(),
  });
  const canStoreCrawlerAccess = !useCrawlerAccessNeedsSetup(projectId);
  const setupHint = canStoreCrawlerAccess ? null : (
    <p className="text-muted-foreground">
      在完成爬虫访问设置之前，无法在此保存签名。{" "}
      <CrawlerAccessSetupHint />
    </p>
  );
  // A recorded credential id names the signature this crawl used, whatever
  // else is stored for the host on another project. If that one has expired
  // since (possibly mid-crawl), expiry is the explanation. Without a recorded
  // id, an expired row for the host is why the crawl went out unsigned.
  const expiredCredential = credentialsQuery.data?.find(
    (credential) =>
      (usedCredentialId
        ? credential.id === usedCredentialId
        : credential.host === host) &&
      isCrawlerAccessExpired(credential.expiresAt),
  );
  // Several projects can hold a live signature for this host; the one this
  // crawl used decides whether the crawl was signed.
  const liveCredentials = (credentialsQuery.data ?? []).filter(
    (credential) =>
      credential.host === host && !isCrawlerAccessExpired(credential.expiresAt),
  );
  const liveCredential =
    liveCredentials.find((credential) => credential.id === usedCredentialId) ??
    liveCredentials[0];
  // A re-run started mid-save would resolve the old signature, or none.
  const isSaving =
    useIsMutating({ mutationKey: saveCrawlerCredentialMutationKey }) > 0;

  const rerunMutation = useMutation({
    mutationFn: () =>
      startAudit({
        data: {
          projectId,
          startUrl: audit.startUrl,
          maxPages: audit.config.maxPages,
          lighthouseStrategy: audit.config.lighthouseStrategy,
          renderJavaScript: audit.config.renderJavaScript,
        },
      }),
    onSuccess: (result) => {
      void navigate({
        to: "/p/$projectId/audit",
        params: { projectId },
        search: { auditId: result.auditId, tab: "issues" },
      });
    },
  });

  const rerunButton = (
    <Button
      variant="outline"
      size="sm"
      pending={rerunMutation.isPending}
      disabled={isSaving}
      onClick={() => rerunMutation.mutate()}
    >
      {rerunMutation.isPending ? "正在启动…" : "重新运行审计"}
    </Button>
  );

  // Until the list loads we can't tell which state applies; don't flash the
  // setup steps at someone who already has a signature.
  if (credentialsQuery.isPending) return null;

  if (liveCredential) {
    const signedAndStillLimited = liveCredential.id === usedCredentialId;
    if (signedAndStillLimited && throttled && !audit.config.renderJavaScript) {
      return (
        <ShopifyRateLimitAlert
          projectId={projectId}
          startUrl={audit.startUrl}
        />
      );
    }
    return (
      <Alert variant={signedAndStillLimited ? "warning" : "success"}>
        {signedAndStillLimited ? <ShieldAlert /> : <ShieldCheck />}
        <AlertDescription className="text-foreground">
          {signedAndStillLimited ? (
            <>
              即使已有签名，Shopify 仍限制了本次抓取。若要确认签名是为{" "}
              <span className="font-mono">{host}</span> 创建的，请在{" "}
              <Link
                to="/p/$projectId/settings/integrations"
                params={{ projectId }}
              >
                项目设置
              </Link>
              中重新粘贴。如果签名无误，说明 Shopify 仍在限流此店铺：请稍后或减少页面数后重新审计。
            </>
          ) : (
            <>
              已为 <span className="font-mono">{host}</span>{" "}
              保存爬虫访问。重新运行审计即可使用。
            </>
          )}
        </AlertDescription>
        <div className="col-start-2 mt-2">{rerunButton}</div>
      </Alert>
    );
  }

  return (
    <Alert variant="warning">
      <ShieldAlert />
      <div className="min-w-0 space-y-3">
        {expiredCredential?.expiresAt ? (
          <>
            <AlertTitle>
              此店铺的 Shopify 签名已过期。
            </AlertTitle>
            {setupHint}
            <p className="text-muted-foreground">
              签名于{" "}
              {new Date(expiredCredential.expiresAt).toLocaleDateString()}{" "}
              过期，之后的请求未带签名，Shopify 因此进行了限制。
              {canStoreCrawlerAccess
                ? " 签名无法续期：请在 Shopify 后台创建新签名，并粘贴到下方以替换已保存的值。"
                : null}
            </p>
          </>
        ) : (
          <>
            <AlertTitle>Shopify 限制了本次抓取。</AlertTitle>
            {setupHint}
            <p className="text-muted-foreground">
              Shopify 会限制未授权的爬虫，因此本报告部分内容缺失。
              {canStoreCrawlerAccess
                ? " 如果你是店铺所有者，授权 OpenSEO 大约只需一分钟。"
                : null}
            </p>
          </>
        )}

        {canStoreCrawlerAccess ? (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                在 Shopify 后台进入「在线商店 → 偏好设置 → 爬虫访问」，然后点击创建签名。
              </li>
              <li>
                选择域名 <span className="font-mono">{host}</span>{" "}
                和有效期（最长 3 个月）。
              </li>
              <li>将两项值粘贴到下方。</li>
            </ol>

            {/* Keyed by host: the report stays mounted when the audit changes. */}
            <CrawlerAccessForm
              key={host}
              projectId={projectId}
              initialHost={host}
              lockHost
            />
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          {rerunButton}
          <a
            className="text-primary underline underline-offset-3"
            href={SHOPIFY_CRAWLER_ACCESS_DOC_URL}
            target="_blank"
            rel="noreferrer"
          >
            Shopify 爬虫访问指南
          </a>
        </div>
      </div>
    </Alert>
  );
}
