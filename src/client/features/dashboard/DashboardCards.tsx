import { GoogleSearchConsoleLogo } from "@/client/features/integrations/GoogleProductLogos";
import { startAudit } from "@/serverFunctions/audit";
import { QueryError } from "@/client/components/QueryState";
import { LoaderCircle, ScanSearch } from "lucide-react";
import { CardShell } from "@/client/components/CardShell";
import { Progress } from "@/client/components/ui/progress";
import { Button } from "@/client/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import { SeverityBadge } from "@/client/features/audit/shared";
import { AUDIT_ISSUE_TYPES } from "@/shared/audit-issues";

import {
  formatCount,
  formatCtr,
  formatPosition,
} from "@/client/features/search-performance/SearchPerformanceColumns";
import { getSearchPerformanceReport } from "@/serverFunctions/searchPerformance";
import {
  formatDay,
  moreDetailsClass,
  MetricsTableSkeleton,
} from "@/client/features/dashboard/cardParts";
import { percentChange } from "@/client/components/MetricsTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import type { DashboardAuditSummary } from "@/server/features/dashboard/services/DashboardService";

// Plain string-keyed view of the registry: issue types from the DB are not
// statically guaranteed to be registry keys.
const issueTitles: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(AUDIT_ISSUE_TYPES).map(([key, value]) => [key, value.title]),
);

export function GscCard({
  projectId,
  connected,
  siteUrl,
}: {
  projectId: string;
  connected: boolean;
  siteUrl: string | null;
}) {
  const reportQuery = useQuery({
    queryKey: ["dashboardGscReport", projectId, siteUrl],
    queryFn: () =>
      getSearchPerformanceReport({
        data: { projectId, dateRange: "last_28_days" },
      }),
    enabled: connected,
    staleTime: 10 * 60_000,
  });
  const report = reportQuery.data;

  // Not connected (or a dead grant discovered by the report call): the
  // connection card sells and runs the whole flow itself.
  if (!connected || (report && !report.connected)) {
    return (
      <div id="connect-gsc">
        <GoogleConnectionCard provider="gsc" projectId={projectId} prominent />
      </div>
    );
  }

  return (
    <CardShell
      title="Google Search Console 表现"
      icon={<GoogleSearchConsoleLogo className="size-5" />}
      action={
        <Link
          to="/p/$projectId/search-performance"
          params={{ projectId }}
          className={moreDetailsClass}
        >
          查看 GSC 洞察 →
        </Link>
      }
    >
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        最近 28 天
      </p>
      {reportQuery.isError ? (
        <p className="text-sm text-muted-foreground">
          无法加载 Search Console 数据，请稍后再试。
        </p>
      ) : !report ? (
        <MetricsTableSkeleton />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>指标</TableHead>
              <TableHead className="text-right">数值</TableHead>
              <TableHead className="text-right">变化</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              {
                label: "点击次数",
                value: formatCount(report.totals.clicks),
                change: percentChange(
                  report.totals.clicks,
                  report.prevTotals.clicks,
                ),
              },
              {
                label: "展示次数",
                value: formatCount(report.totals.impressions),
                change: percentChange(
                  report.totals.impressions,
                  report.prevTotals.impressions,
                ),
              },
              {
                label: "点击率",
                value: formatCtr(report.totals.ctr),
                change: null,
              },
              {
                label: "平均排名",
                value: formatPosition(report.totals.position),
                change: null,
              },
            ].map((metric) => (
              <TableRow key={metric.label}>
                <TableCell>{metric.label}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {metric.value}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${metric.change === null || metric.change === 0 ? "text-muted-foreground" : metric.change > 0 ? "text-success" : "text-destructive"}`}
                >
                  {metric.change === null
                    ? "—"
                    : `${metric.change > 0 ? "+" : ""}${metric.change}%`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardShell>
  );
}

export function AuditHealthCard({
  projectId,
  audit,
  domain,
}: {
  projectId: string;
  audit: DashboardAuditSummary | null;
  domain: string | null;
}) {
  const queryClient = useQueryClient();
  const scan = useMutation({
    mutationFn: () =>
      startAudit({
        data: {
          projectId,
          startUrl: `https://${domain}`,
          maxPages: 50,
          renderJavaScript: true,
        },
      }),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["dashboardOverview", projectId],
      }),
    meta: { errorToast: false },
  });
  if (!audit)
    return (
      <CardShell title="网站健康">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <ScanSearch className="size-7 text-muted-foreground" />
          <h3 className="font-medium">找出拖累网站的问题</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            扫描最多 50 个页面，查找失效链接、缺失标题以及 Google
            无法收录的页面。
          </p>
          {domain ? (
            <Button disabled={scan.isPending} onClick={() => scan.mutate()}>
              {scan.isPending ? "正在开始扫描…" : "扫描我的网站"}
            </Button>
          ) : (
            <Button
              nativeButton={false}
              render={
                <Link to="/p/$projectId/settings" params={{ projectId }} />
              }
            >
              添加你的网站
            </Button>
          )}
          {scan.isError && (
            <QueryError
              error={scan.error}
              fallback="无法开始扫描"
            />
          )}
        </div>
      </CardShell>
    );

  if (audit.status === "running") {
    const isLighthouse = audit.currentPhase === "lighthouse";
    const isFinalizing = audit.currentPhase === "finalizing";
    const checked = isLighthouse
      ? audit.lighthouseCompleted + audit.lighthouseFailed
      : audit.pagesCrawled;
    const total = isLighthouse ? audit.lighthouseTotal : audit.pagesTotal;
    // A running crawl has at most a partial issue list, and an empty one is
    // not the same as a healthy site, so show progress instead.
    return (
      <CardShell
        title="网站健康"
        action={
          <Link
            to="/p/$projectId/audit"
            params={{ projectId }}
            search={{ auditId: audit.id }}
            className={moreDetailsClass}
          >
            查看进度
          </Link>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
          <h3 className="font-medium">
            {isLighthouse
              ? "正在运行 Lighthouse 检查"
              : isFinalizing
                ? "正在整理结果"
                : audit.currentPhase === "discovery"
                  ? "正在查找要扫描的页面"
                  : "正在扫描你的网站"}
          </h3>
          {!isFinalizing && (
            <Progress
              className="w-full max-w-xs"
              value={checked}
              max={total || 1}
              aria-label={isLighthouse ? "Lighthouse 检查" : "已抓取页面"}
            />
          )}
          <p className="text-sm text-muted-foreground tabular-nums">
            {isLighthouse
              ? `${checked} / ${total} 项检查${audit.lighthouseFailed > 0 ? `（${audit.lighthouseFailed} 项失败）` : ""}`
              : isFinalizing
                ? `已抓取 ${audit.pagesCrawled} 个页面，正在完成报告。`
                : `已抓取 ${checked} / 最多 ${total} 个页面`}
          </p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell
      title="网站健康"
      action={
        <Link
          to="/p/$projectId/audit"
          params={{ projectId }}
          search={{ auditId: audit.id, tab: "issues" }}
          className={moreDetailsClass}
        >
          查看问题
        </Link>
      }
    >
      {audit.status === "failed" && (
        <p className="mb-4 text-sm text-destructive">
          最近一次扫描未完成。可以查看已有结果，或重试。
        </p>
      )}
      {audit.status === "completed" && (
        <p className="mb-4 text-sm text-muted-foreground">
          已检查 {audit.pagesCrawled} 个页面 · {formatDay(audit.startedAt)}
        </p>
      )}
      {audit.topIssues.length === 0 ? (
        audit.status === "completed" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-success" />
            未发现问题，网站状态良好。
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            再次运行审计以查看问题。
          </p>
        )
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>问题</TableHead>
              <TableHead>严重程度</TableHead>
              <TableHead className="text-right">受影响页面</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.topIssues.map((issue) => (
              <TableRow key={issue.issueType}>
                <TableCell>
                  {issueTitles[issue.issueType] ?? issue.issueType}
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={issue.severity}>
                    {issue.severity === "critical"
                      ? "严重"
                      : issue.severity === "warning"
                        ? "警告"
                        : "提示"}
                  </SeverityBadge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {issue.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardShell>
  );
}
