import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { SegmentedToggle } from "@/client/components/SegmentedToggle";
import { Skeleton } from "@/client/components/ui/skeleton";
import { Alert, AlertDescription } from "@/client/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import type { AiTrend, AiTrendMetric } from "@/shared/ai-visibility";
import { EngineLabel } from "./EngineLabel";
import { trendSeries, VisibilityTrendChart } from "./VisibilityTrendChart";
import { AiQueryError, type AiTrendDays, aiTrendQueryOptions } from "./shared";

const periods = [
  { value: "7", icon: null, label: "7天" },
  { value: "28", icon: null, label: "28天" },
  { value: "90", icon: null, label: "90天" },
];

const rate = (value: number | null) =>
  value === null ? "—" : `${Math.round(value)}%`;

function notice(trend: AiTrend, collecting: boolean) {
  const { days } = trend;
  switch (trend.comparison) {
    case "incomplete":
      return `某个周期收集到的计划回答不足 90%，因此不显示变化。收集失败不会计为可见度下降。`;
    case "scope_changed":
      return `没有提示词和引擎在两个周期里都有同一市场和品牌的回答。追踪范围已变化，无法比较这两个周期。`;
    case "no_data":
      return collecting
        ? "正在收集回答。运行完成后这里会显示可见度。"
        : `最近 ${days} 天没有已完成的运行。`;
    default:
      return null;
  }
}

/** The trend panel inside the Prompt tracking card, laid out like rank tracking's overview. */
export function VisibilityTrend({
  projectId,
  collecting,
}: {
  projectId: string;
  collecting: boolean;
}) {
  const [days, setDays] = useState<AiTrendDays>(7);
  const query = useQuery(aiTrendQueryOptions(projectId, days));
  const trend = query.data;
  const message = trend && notice(trend, collecting);
  // Incomplete collection and a changed scope need attention; missing history does not.
  const warning =
    trend?.comparison === "incomplete" || trend?.comparison === "scope_changed";
  return (
    <div className="px-4 pt-2 pb-6">
      <section className="space-y-3 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">可见度趋势</h2>
          <SegmentedToggle
            showLabels
            items={periods}
            value={String(days)}
            onChange={(next) =>
              setDays(next === "90" ? 90 : next === "28" ? 28 : 7)
            }
          />
        </div>
        {query.isError && (
          <AiQueryError
            error={query.error}
            retry={() => {
              void query.refetch();
            }}
          />
        )}
        {query.isPending && <Skeleton className="h-[220px] w-full" />}
        {trend && (
          <>
            {trend.current.coverage.runs > 0 && (
              <>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {trendSeries.map((series) => (
                      <span
                        key={series.key}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                      >
                        <span
                          className="size-2 rounded-sm"
                          style={{ backgroundColor: series.color }}
                        />
                        {series.label}
                      </span>
                    ))}
                  </div>
                  <VisibilityTrendChart trend={trend} />
                </div>
                <TrendSummary trend={trend} />
              </>
            )}
            {message && (
              <Alert variant={warning ? "warning" : "info"}>
                {warning ? <TriangleAlert /> : <Info />}
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Change({ metric }: { metric: AiTrendMetric }) {
  if (metric.change === null) return null;
  const up = metric.change > 0;
  const down = metric.change < 0;
  return (
    <span
      className={cn(
        "text-sm whitespace-nowrap tabular-nums",
        up && "text-success",
        down && "text-destructive",
        !up && !down && "text-muted-foreground",
      )}
    >
      {up ? "▲ " : down ? "▼ " : ""}
      {Math.abs(metric.change).toFixed(1)}%
    </span>
  );
}

/**
 * Rates under the chart in the shared table, as on the Competitors page: all
 * engines first, then one row per engine.
 */
function TrendSummary({ trend }: { trend: AiTrend }) {
  const rows = [
    {
      key: "all",
      label: <span className="font-medium">全部引擎</span>,
      mentions: trend.mentions,
      citations: trend.citations,
    },
    ...(trend.engines.length > 1
      ? trend.engines.map((row) => ({
          key: row.engine,
          label: <EngineLabel engine={row.engine} />,
          mentions: row.mentions,
          citations: row.citations,
        }))
      : []),
  ];
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>品牌提及</TableHead>
          <TableHead>自有引用</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>{row.label}</TableCell>
            {[row.mentions, row.citations].map((metric, index) => (
              <TableCell key={index}>
                <span className="flex items-baseline gap-2 tabular-nums">
                  <span
                    className={cn(
                      row.key === "all"
                        ? "text-lg font-semibold"
                        : "font-medium",
                    )}
                  >
                    {rate(metric.current)}
                  </span>
                  <Change metric={metric} />
                </span>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
