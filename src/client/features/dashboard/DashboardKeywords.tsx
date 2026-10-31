import { Link } from "@tanstack/react-router";
import { Button } from "@/client/components/ui/button";
import { getSearchPerformanceReport } from "@/serverFunctions/searchPerformance";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsTrigger } from "@/client/components/ui/tabs";
import { DataTableTabs } from "@/client/components/table/DataTableToolbar";
import { QueryError } from "@/client/components/QueryState";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import {
  getDashboardEmergingQueries,
  getDashboardKeywords,
} from "@/serverFunctions/dashboard";
import { DashboardKeywordTable } from "./DashboardKeywordTable";
import { Freshness } from "./siteTabParts";

const SOURCES = ["new", "top", "striking"] as const;
type Source = (typeof SOURCES)[number];

const DESCRIPTIONS: Record<Source, string> = {
  new: "你的网站出现在 Search Console 最新一周数据中、但前四周没有的搜索。",
  top: "过去 28 天为你的网站带来最多点击的搜索。",
  striking:
    "过去 28 天排名在 5–20 的关键词。优化对应页面有助于它们往前排。",
};

export function DashboardKeywords({
  projectId,
  connected,
  siteUrl,
}: {
  projectId: string;
  connected: boolean;
  siteUrl: string | null;
}) {
  const [source, setSource] = useState<Source>("new");
  const emerging = useQuery({
    queryKey: ["dashboardEmergingQueries", projectId, siteUrl],
    queryFn: () => getDashboardEmergingQueries({ data: { projectId } }),
    enabled: connected && source === "new",
    staleTime: 10 * 60_000,
    retry: false,
  });
  const keywords = useQuery({
    queryKey: ["dashboardGscKeywords", projectId, siteUrl],
    queryFn: () => getDashboardKeywords({ data: { projectId } }),
    enabled: connected && source === "top",
    staleTime: 10 * 60_000,
    retry: false,
  });
  const striking = useQuery({
    queryKey: ["dashboardGscReport", projectId, siteUrl],
    queryFn: () =>
      getSearchPerformanceReport({
        data: { projectId, dateRange: "last_28_days" },
      }),
    enabled: connected && source === "striking",
    staleTime: 10 * 60_000,
  });
  if (!connected)
    return (
      <GoogleConnectionCard provider="gsc" projectId={projectId} prominent />
    );

  const query =
    source === "new" ? emerging : source === "top" ? keywords : striking;
  const cached =
    source === "new" ? emerging.data : source === "top" ? keywords.data : null;
  const result =
    source === "striking"
      ? striking.data && {
          connected: striking.data.connected,
          rows: striking.data.connected ? striking.data.strikingDistance : [],
        }
      : cached?.value;
  if (result && !result.connected)
    return (
      <GoogleConnectionCard provider="gsc" projectId={projectId} prominent />
    );

  return (
    <DashboardKeywordTable
      resetKey={source}
      rows={result?.rows ?? []}
      showPages={source === "striking"}
      sortBy={source === "top" ? "clicks" : "impressions"}
      isLoading={query.isPending}
      error={
        query.isError ? (
          <QueryError
            error={query.error}
            fallback="无法加载关键词"
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : null
      }
      empty={
        source === "new"
          ? {
              title:
                emerging.data?.value.hasSearchData === false
                  ? "还没有搜索数据"
                  : "本周没有新关键词",
            }
          : source === "striking"
            ? { title: "这段时间没有排名 5–20 的关键词" }
            : { title: "还没有关键词" }
      }
      tabs={
        <DataTableTabs
          value={source}
          onValueChange={(value) => {
            const next = SOURCES.find((item) => item === value);
            if (next) setSource(next);
          }}
          actions={
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  to="/p/$projectId/search-performance"
                  params={{ projectId }}
                />
              }
            >
              查看完整 GSC 洞察 →
            </Button>
          }
          description={
            <>
              {DESCRIPTIONS[source]}
              {cached ? <Freshness {...cached} /> : null}
            </>
          }
        >
          <TabsTrigger value="new">新关键词</TabsTrigger>
          <TabsTrigger value="top">热门关键词</TabsTrigger>
          <TabsTrigger value="striking">冲刺距离</TabsTrigger>
        </DataTableTabs>
      }
    />
  );
}
