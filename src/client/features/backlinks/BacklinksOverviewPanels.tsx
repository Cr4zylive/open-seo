import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { RESEARCH_SCOPE_LABELS } from "@/shared/researchScope";
import { HeaderHelpLabel } from "@/client/features/keywords/components";
import {
  BacklinksNewLostChart,
  BacklinksTrendChart,
} from "./BacklinksPageCharts";
import type { BacklinksOverviewData } from "./backlinksPageTypes";
import { formatRelativeTimestamp } from "./backlinksPageUtils";

type SummaryStat = { label: string; value: string; description: string };

export function BacklinksOverviewPanels({
  projectId,
  data,
  summaryStats,
}: {
  projectId: string;
  data: BacklinksOverviewData;
  summaryStats: SummaryStat[];
}) {
  return (
    <>
      <div>
        <Link
          to="/p/$projectId/backlinks"
          params={{ projectId }}
          search={{
            target: undefined,
            scope: undefined,
            tab: undefined,
            page: undefined,
            size: undefined,
            sort: undefined,
            order: undefined,
          }}
          replace
          className="btn btn-ghost btn-sm gap-2 px-0 text-base-content/70 hover:bg-transparent"
        >
          <ArrowLeft className="size-4" />
          最近搜索
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/65">
        <span className="badge badge-outline">
          {RESEARCH_SCOPE_LABELS[data.scope]}
        </span>
        <span>目标：{data.displayTarget}</span>
        <span>-</span>
        <span>更新时间 {formatRelativeTimestamp(data.fetchedAt)}</span>
        {/* history/live can't exclude subdomains, so say so rather than imply
            the charts match the domain-scoped totals. */}
        {data.scope === "domain" ? (
          <span>- 趋势包含子域名</span>
        ) : null}
      </div>
      <OverviewGrid data={data} summaryStats={summaryStats} />
      {data.scope === "exact_url" ? (
        <div className="alert alert-info">
          <span>
            当前显示此精确页面的反向链接。将范围切换为「域名」或「含子域名」可查看全站结果；趋势图需要其中一种范围。
          </span>
        </div>
      ) : null}
      {data.scope === "subfolder" ? (
        <div className="alert alert-info">
          <span>
            当前显示指向此目录的反向链接。计数来自筛选后的反向链接总量；排名、趋势和引荐域名明细需要「域名」或「含子域名」范围。
          </span>
        </div>
      ) : null}
    </>
  );
}

function OverviewGrid({
  data,
  summaryStats,
}: {
  data: BacklinksOverviewData;
  summaryStats: SummaryStat[];
}) {
  // Trend charts need history/live, which only takes a whole hostname.
  const domainScope = data.scope === "domain" || data.scope === "subdomains";

  return (
    <div
      className={`grid grid-cols-1 gap-3 ${domainScope ? "md:grid-cols-2 xl:grid-cols-3" : ""}`}
    >
      <SummaryStatsGrid data={data} summaryStats={summaryStats} />
      {domainScope ? <TrendPanels data={data} /> : null}
    </div>
  );
}

function SummaryStatsGrid({
  data,
  summaryStats,
}: {
  data: BacklinksOverviewData;
  summaryStats: SummaryStat[];
}) {
  const hasTrendPanels = data.scope === "domain" || data.scope === "subdomains";
  const cardClassName = `card bg-base-100 border border-base-300 ${hasTrendPanels ? "md:col-span-2 xl:col-span-1" : ""}`;

  return (
    <div className={cardClassName}>
      <div className="card-body p-4 xl:h-full">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 xl:gap-y-6">
          {summaryStats.map((item) => (
            <div key={item.label}>
              <div className="text-xs uppercase tracking-wide text-base-content/55">
                <HeaderHelpLabel
                  label={item.label}
                  helpText={item.description}
                />
              </div>
              <p className="text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendPanels({ data }: { data: BacklinksOverviewData }) {
  return (
    <>
      <TrendCard
        title="反向链接增长"
        description="过去一年的反向链接和引用域名变化"
      >
        <BacklinksTrendChart data={data.trends} />
      </TrendCard>
      <TrendCard title="新增与丢失" description="反向链接新增与流失情况">
        <BacklinksNewLostChart data={data.newLostTrends} />
      </TrendCard>
    </>
  );
}

function TrendCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body gap-2 p-4">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs text-base-content/55">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
