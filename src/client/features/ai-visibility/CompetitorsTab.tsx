import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getAiVisibilityResults } from "@/serverFunctions/ai-visibility";
import type { AiEngine, AiTrackerState } from "@/shared/ai-visibility";
import { SkeletonTableRows } from "@/client/components/SkeletonPresets";
import { DataTableToolbar } from "@/client/components/table/DataTableToolbar";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { EngineFilter } from "./EngineFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { DomainFavicon } from "./DomainFavicon";
import { SuggestedCompetitors } from "./SuggestedCompetitors";
import { AiQueryError, aiVisibilityKey } from "./shared";

export function CompetitorsTab({
  projectId,
  state,
  runId,
  collecting,
}: {
  projectId: string;
  state: AiTrackerState;
  runId: string | undefined;
  collecting: boolean;
}) {
  const [selectedEngines, setSelectedEngines] = useState<AiEngine[] | null>(
    null,
  );
  const engines = selectedEngines ?? state.engines;
  const query = useQuery({
    queryKey: [
      ...aiVisibilityKey(projectId),
      "results",
      "competitors",
      runId,
      engines,
    ],
    queryFn: () =>
      getAiVisibilityResults({
        data: { projectId, runId, engines, limit: 1 },
      }),
    enabled: Boolean(runId),
  });
  const rows = runId
    ? (query.data?.summaries ?? []).map((summary) => ({ ...summary, summary }))
    : state.brands
        .filter((brand) => !brand.own)
        .map((brand) => ({ ...brand, summary: null }));
  return (
    <>
      <DataTableToolbar
        actions={
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link to="/p/$projectId/context" params={{ projectId }} />}
          >
            管理竞争对手
          </Button>
        }
      >
        {runId && state.engines.length > 1 && (
          <EngineFilter
            label="筛选引擎"
            engines={state.engines}
            value={engines}
            onChange={setSelectedEngines}
          />
        )}
      </DataTableToolbar>
      {runId && query.isPending ? (
        <SkeletonTableRows rows={4} columns={4} className="p-4" />
      ) : query.isError ? (
        <AiQueryError error={query.error} />
      ) : runId && !rows.length ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          {collecting
            ? "正在收集回答。品牌会随回答陆续出现。"
            : "没有符合这些筛选条件的回答。"}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>品牌</TableHead>
              <TableHead>被提及</TableHead>
              <TableHead>被引用</TableHead>
              <TableHead>平均位置</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ name, domain, own, summary }) => (
              <TableRow key={domain}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <DomainFavicon domain={domain} />
                    {name}
                    {own && (
                      <Badge variant="secondary" className="ml-2">
                        自有
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  {summary ? share(summary.mentions, summary.answers) : "—"}
                </TableCell>
                <TableCell>
                  {summary ? share(summary.citations, summary.answers) : "—"}
                </TableCell>
                <TableCell>
                  {summary?.positionCount
                    ? (summary.positionTotal / summary.positionCount).toFixed(1)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  尚未保存竞争对手。点「管理竞争对手」添加。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
      {!runId && (
        <p className="border-t border-border p-4 text-sm text-muted-foreground">
          运行{" "}
          <Link
            to="/p/$projectId/ai-visibility"
            params={{ projectId }}
            className="text-foreground underline underline-offset-4"
          >
            提示词追踪
          </Link>{" "}
          后，即可查看 AI 回答提及和引用竞争对手的频率。
        </p>
      )}
      {runId && (
        <SuggestedCompetitors
          projectId={projectId}
          state={state}
          runId={runId}
        />
      )}
    </>
  );
}

function share(count: number, total: number) {
  return total
    ? `${count} / ${total} (${Math.round((count / total) * 100)}%)`
    : "无回答";
}
