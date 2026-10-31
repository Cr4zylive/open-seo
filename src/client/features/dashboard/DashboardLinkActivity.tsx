import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/client/components/ui/table";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import { CardShell } from "@/client/components/CardShell";
import { QueryState } from "@/client/components/QueryState";
import { getDashboardLinkActivity } from "@/serverFunctions/dashboard";
import { DashboardInfo, ExternalPage, Freshness } from "./siteTabParts";
import { moreDetailsClass } from "./cardParts";
export function DashboardLinkActivity({
  projectId,
  domain,
}: {
  projectId: string;
  domain: string;
}) {
  const query = useQuery({
    queryKey: ["dashboardLinkActivity", projectId, domain],
    queryFn: () => getDashboardLinkActivity({ data: { projectId } }),
    staleTime: 86400_000,
    retry: false,
  });
  return (
    <QueryState query={query} errorFallback="无法加载新链接">
      {(data) => (
        <CardShell
          title="新增反向链接"
          titleInfo={
            <DashboardInfo label="关于新链接">
              <p>
                过去一周发现的指向你网站的链接。优先展示新的来源站点。
              </p>
              <p className="mt-2">
                链接本身可能早于发现日期。
              </p>
            </DashboardInfo>
          }
          action={
            <Link
              to="/p/$projectId"
              params={{ projectId }}
              search={{ tab: "backlinks" }}
              className={moreDetailsClass}
            >
              查看全部 →
            </Link>
          }
        >
          <Freshness {...data} />
          {data.value.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>来源域名</TableHead>
                  <TableHead className="text-right">反向链接</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.value.slice(0, 5).map((row, index) => (
                  <TableRow key={row.domain ?? index}>
                    <TableCell className="font-medium">
                      <ExternalPage
                        url={row.domain ? `https://${row.domain}` : null}
                        label={row.domain}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.backlinks?.toLocaleString() ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : data.links.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>来源页面</TableHead>
                  <TableHead>锚文本</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.links.slice(0, 5).map((row, index) => (
                  <TableRow key={`${row.urlFrom}:${index}`}>
                    <TableCell>
                      <ExternalPage url={row.urlFrom} label={row.domainFrom} />
                    </TableCell>
                    <TableCell
                      className="max-w-48 truncate"
                      title={row.anchor ?? undefined}
                    >
                      {row.anchor || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <Link2 className="size-7 text-muted-foreground" />
              <h3 className="font-medium">本周没有新链接</h3>
              <p className="text-sm text-muted-foreground">
                去看看已经链接到你的站点。
              </p>
              <Link
                to="/p/$projectId"
                params={{ projectId }}
                search={{ tab: "backlinks" }}
                className="text-sm text-primary hover:underline"
              >
                查看反向链接 →
              </Link>
            </div>
          )}
        </CardShell>
      )}
    </QueryState>
  );
}
