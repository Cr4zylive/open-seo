import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { CardShell } from "@/client/components/CardShell";
import { QueryState } from "@/client/components/QueryState";
import { GoogleConnectionCard } from "@/client/features/integrations/GoogleConnectionCard";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/client/components/ui/table";
import { getDashboardEmergingQueries } from "@/serverFunctions/dashboard";
import { Freshness, DashboardInfo } from "./siteTabParts";
import { moreDetailsClass } from "./cardParts";

export function DashboardNewQueries({
  projectId,
  connected,
  siteUrl,
}: {
  projectId: string;
  connected: boolean;
  siteUrl: string | null;
}) {
  const query = useQuery({
    queryKey: ["dashboardEmergingQueries", projectId, siteUrl],
    queryFn: () => getDashboardEmergingQueries({ data: { projectId } }),
    enabled: connected,
    staleTime: 10 * 60_000,
    retry: false,
  });
  if (!connected) return null;
  return (
    <QueryState query={query} errorFallback="无法加载新关键词">
      {(data) =>
        !data.value.connected ? (
          <GoogleConnectionCard
            provider="gsc"
            projectId={projectId}
            prominent
          />
        ) : (
          <CardShell
            title="新关键词"
            titleInfo={
              <DashboardInfo label="关于新关键词">
                <p>你的网站最近出现在 Google 搜索结果中的查询。</p>
                <p className="mt-2">
                  这些词出现在 Search Console 最新一周的数据里，但前四周没有。
                </p>
              </DashboardInfo>
            }
            action={
              <Link
                to="/p/$projectId"
                params={{ projectId }}
                search={{ tab: "keywords" }}
                className={moreDetailsClass}
              >
                查看全部 →
              </Link>
            }
          >
            <Freshness {...data} />
            {data.value.rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>关键词</TableHead>
                    <TableHead>展示次数</TableHead>
                    <TableHead>点击次数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.value.rows.slice(0, 5).map((row) => (
                    <TableRow key={row.query}>
                      <TableCell className="font-medium">{row.query}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell>{row.clicks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
                <Search className="size-7 text-muted-foreground" />
                <h3 className="font-medium">
                  {data.value.hasSearchData
                    ? "本周没有新关键词"
                    : "还没有搜索数据"}
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {data.value.hasSearchData
                    ? "现有查询仍可能在获得点击。去看看它们的表现。"
                    : "Google 还没有报告你网站的搜索数据。请检查 Search Console 中已连接的媒体资源。"}
                </p>
                <Link
                  to="/p/$projectId/search-performance"
                  params={{ projectId }}
                  className="text-sm text-primary hover:underline"
                >
                  查看完整 GSC 洞察 →
                </Link>
              </div>
            )}
          </CardShell>
        )
      }
    </QueryState>
  );
}
