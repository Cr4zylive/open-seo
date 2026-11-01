import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { SafeExternalLink } from "@/client/components/SafeExternalLink";
import { SegmentedToggle } from "@/client/components/SegmentedToggle";
import { SkeletonTableRows } from "@/client/components/SkeletonPresets";
import { DataTableToolbar } from "@/client/components/table/DataTableToolbar";
import { Button } from "@/client/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/client/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { getAiVisibilitySources } from "@/serverFunctions/ai-visibility";
import {
  AI_ENGINE_LABELS,
  type AiEngine,
  type AiPrompt,
  type AiSourceRow,
  type AiTrackerState,
} from "@/shared/ai-visibility";
import { EngineLabel } from "./EngineLabel";
import { EngineFilter } from "./EngineFilter";
import { AiQueryError, aiVisibilityKey } from "./shared";

export function CitationsTab({
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
  const [groupBy, setGroupBy] = useState<"url" | "domain">("url");
  const [ownership, setOwnership] = useState<
    "all" | "own" | "competitor" | "other"
  >("all");
  const [selectedEngines, setSelectedEngines] = useState<AiEngine[] | null>(
    null,
  );
  const [cursor, setCursor] = useState<string | undefined>();
  const engines = selectedEngines ?? state.engines;
  const query = useQuery({
    queryKey: [
      ...aiVisibilityKey(projectId),
      "sources",
      runId,
      groupBy,
      ownership,
      engines,
      cursor,
    ],
    queryFn: () =>
      getAiVisibilitySources({
        data: {
          projectId,
          runId,
          groupBy,
          branded: "all",
          ownership,
          engines,
          cursor,
        },
      }),
    enabled: Boolean(runId),
  });
  const reset = () => setCursor(undefined);
  return (
    <>
      {runId && (
        <DataTableToolbar>
          <SegmentedToggle
            showLabels
            items={[
              { value: "url", label: "页面", icon: null },
              { value: "domain", label: "域名", icon: null },
            ]}
            value={groupBy}
            onChange={(value) => {
              setGroupBy(value);
              reset();
            }}
          />
          <Select
            items={OWNERSHIP_ITEMS}
            value={ownership}
            onValueChange={(value) => {
              const item = OWNERSHIP_ITEMS.find(
                (option) => option.value === value,
              );
              if (item) setOwnership(item.value);
              reset();
            }}
          >
            <SelectTrigger size="sm" aria-label="按来源归属筛选">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OWNERSHIP_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.engines.length > 1 && (
            <EngineFilter
              label="按引擎筛选来源"
              engines={state.engines}
              value={engines}
              onChange={(next) => {
                setSelectedEngines(next);
                reset();
              }}
            />
          )}
        </DataTableToolbar>
      )}
      {!runId ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          运行{" "}
          <Link
            to="/p/$projectId/ai-visibility"
            params={{ projectId }}
            className="text-foreground underline underline-offset-4"
          >
            提示词追踪
          </Link>{" "}
          后，即可查看 AI 回答引用了哪些页面。
        </p>
      ) : query.isPending ? (
        <SkeletonTableRows rows={6} columns={5} className="p-4" />
      ) : query.isError ? (
        <AiQueryError
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        />
      ) : !query.data.rows.length ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          {collecting
            ? "正在收集回答。引用页面会随回答陆续出现。"
            : "没有符合这些筛选条件的引用。"}
        </p>
      ) : (
        <SourcesTable
          projectId={projectId}
          prompts={state.prompts}
          rows={query.data.rows}
          groupBy={groupBy}
          engines={state.engines}
        />
      )}
      {(cursor || query.data?.nextCursor) && (
        <div className="flex justify-end gap-2 border-t p-3 border-border">
          <Button
            variant="ghost"
            size="sm"
            disabled={!cursor}
            onClick={() => setCursor(undefined)}
          >
            第一页
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!query.data?.nextCursor}
            onClick={() => setCursor(query.data?.nextCursor ?? undefined)}
          >
            下一页 <ArrowRight />
          </Button>
        </div>
      )}
    </>
  );
}

const OWNERSHIP_ITEMS = [
  { value: "all", label: "全部归属" },
  { value: "own", label: "你的域名" },
  { value: "competitor", label: "竞争对手域名" },
  { value: "other", label: "第三方域名" },
] as const;

function SourcesTable({
  projectId,
  prompts,
  rows,
  groupBy,
  engines,
}: {
  projectId: string;
  prompts: AiPrompt[];
  rows: AiSourceRow[];
  groupBy: "url" | "domain";
  engines: AiEngine[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            {groupBy === "domain" ? "域名" : "引用页面"}
          </TableHead>
          <TableHead>归属</TableHead>
          <TableHead>回答</TableHead>
          <TableHead>提示词</TableHead>
          <TableHead>引擎</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <SourceRow
            key={row.key}
            projectId={projectId}
            prompts={prompts.filter((prompt) =>
              row.promptIds.includes(prompt.id),
            )}
            row={row}
            engines={engines}
            expanded={expanded === row.key}
            onExpand={() => setExpanded(expanded === row.key ? null : row.key)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function SourceRow({
  projectId,
  prompts,
  row,
  engines,
  expanded,
  onExpand,
}: {
  projectId: string;
  prompts: AiPrompt[];
  row: AiSourceRow;
  engines: AiEngine[];
  expanded: boolean;
  onExpand: () => void;
}) {
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={(event) => {
          // Opening the cited page should not also toggle the row.
          if (!(event.target instanceof Element && event.target.closest("a")))
            onExpand();
        }}
      >
        <TableCell className="min-w-60 max-w-lg whitespace-normal">
          <SafeExternalLink
            url={row.url || `https://${row.domain}`}
            label={row.title || row.url || row.domain}
            className="flex items-start gap-1.5 break-all text-sm text-primary hover:underline"
          />
          <p className="mt-1 text-xs text-muted-foreground">{row.domain}</p>
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs">
          {row.ownership === "own"
            ? "你的域名"
            : row.ownership === "competitor"
              ? "竞争对手"
              : "第三方"}
        </TableCell>
        <TableCell>{row.answerCount}</TableCell>
        <TableCell>{row.promptCount}</TableCell>
        <TableCell>
          <div className="flex flex-wrap items-center gap-3">
            {engines.map((tracked) => {
              const count = row.engines.find(
                (item) => item.engine === tracked,
              )?.answerCount;
              return (
                <span
                  key={tracked}
                  title={AI_ENGINE_LABELS[tracked]}
                  className={`flex items-center gap-1 text-xs tabular-nums ${count ? "" : "text-muted-foreground/60"}`}
                >
                  <EngineLabel engine={tracked} />
                  {count ?? "–"}
                </span>
              );
            })}
          </div>
        </TableCell>
        <TableCell className="w-10">
          {/* The click bubbles to the row, which does the toggling. */}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={expanded}
            aria-label={`显示引用了 ${row.title || row.url || row.domain} 的提示词`}
          >
            {expanded ? <ChevronDown /> : <ChevronRight />}
          </Button>
        </TableCell>
      </TableRow>
      {expanded &&
        prompts.map((prompt) => (
          <TableRow key={prompt.id} className="bg-muted/30">
            {/* The link fills the cell so the whole row opens the prompt. */}
            <TableCell colSpan={6} className="p-0 whitespace-normal">
              <Link
                to="/p/$projectId/ai-visibility/prompts/$promptId"
                params={{ projectId, promptId: prompt.id }}
                className="block py-1.5 pr-4 pl-8 text-sm whitespace-pre-wrap"
                data-ph-mask
              >
                {prompt.text}
              </Link>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
