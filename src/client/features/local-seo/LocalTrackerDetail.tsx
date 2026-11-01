import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, List, Pencil, Play } from "lucide-react";
import { getLocalTracker, startLocalCheck } from "@/serverFunctions/local-seo";
import { QueryError, QueryState } from "@/client/components/QueryState";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { SegmentedToggle } from "@/client/components/SegmentedToggle";
import { Button } from "@/client/components/ui/button";
import { Card } from "@/client/components/ui/card";
import { Progress } from "@/client/components/ui/progress";
import { Spinner } from "@/client/components/ui/spinner";
import {
  isLocalScanActive,
  localAreaLabel,
  LocalScanStatus,
} from "@/shared/local-seo";
import { LocalKeywordMap } from "./LocalKeywordMap";
import { LocalKeywordsDialog } from "./LocalKeywordsDialog";
import { LocalKeywordsTable, latestKeywordScan } from "./LocalKeywordsTable";
import type { LocalSeoSearch } from "@/types/schemas/local-seo-search";

type TrackerData = Awaited<ReturnType<typeof getLocalTracker>>;

// The workflow runs a keyword's points in waves of six live searches, each
// wave ~3-5 s, so a check takes about five seconds per wave.
function checkDurationLabel(keywords: number, points: number) {
  const seconds = keywords * Math.ceil(points / 6) * 5;
  return seconds < 60
    ? "不到一分钟"
    : `约 ${Math.ceil(seconds / 60)} 分钟`;
}

export function LocalTrackerDetail({
  projectId,
  trackerId,
  search,
  onSearchChange,
}: {
  projectId: string;
  trackerId: string;
  search: LocalSeoSearch;
  onSearchChange: (search: LocalSeoSearch) => void;
}) {
  const query = useQuery({
    queryKey: ["localSeo", projectId, "tracker", trackerId],
    queryFn: () => getLocalTracker({ data: { projectId, trackerId } }),
    refetchInterval: (state) =>
      state.state.data?.checks.some((check) => isLocalScanActive(check.status))
        ? 4000
        : false,
  });
  return (
    <QueryState query={query} errorFallback="无法加载本地追踪">
      {(data) => (
        <TrackerContent
          projectId={projectId}
          data={data}
          search={search}
          onSearchChange={onSearchChange}
        />
      )}
    </QueryState>
  );
}

function TrackerContent({
  projectId,
  data,
  search,
  onSearchChange,
}: {
  projectId: string;
  data: TrackerData;
  search: LocalSeoSearch;
  onSearchChange: (search: LocalSeoSearch) => void;
}) {
  const { tracker, keywords, checks, scans, estimate } = data;
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [managingKeywords, setManagingKeywords] = useState(false);
  const keyword =
    keywords.find((row) => row.id === search.keyword) ?? keywords[0];
  const latestScan = keyword && latestKeywordScan(scans, keyword.id);
  const selectedScan =
    scans.find(
      (scan) => scan.keywordId === keyword?.id && scan.id === search.scan,
    ) ?? latestScan;
  const start = useMutation({
    mutationFn: (requestId: string) =>
      startLocalCheck({
        data: {
          projectId,
          trackerId: tracker.id,
          requestId,
          maxCostCredits: estimate.costCredits,
        },
      }),
    onSuccess: async () => {
      setConfirm(null);
      onSearchChange({ keyword: keyword?.id });
      await queryClient.invalidateQueries({
        queryKey: ["localSeo", projectId],
      });
    },
  });
  const active = checks.find((check) => isLocalScanActive(check.status));
  const searchesDone = scans
    .filter((scan) => scan.checkId === active?.id)
    .reduce((total, scan) => total + (scan.summary?.completed ?? 0), 0);
  // Latest falls back to each keyword's newest results, so say when the map
  // shows an older check because the newest one returned none.
  const failed =
    checks[0]?.status === LocalScanStatus.Failed &&
    selectedScan?.checkId !== checks[0].id &&
    checks[0];
  const historyAvailable =
    checks.filter((check) => !isLocalScanActive(check.status)).length >= 2;
  const history = historyAvailable && search.view === "history";
  return (
    <div className="space-y-3">
      <Card className="min-w-0 gap-0 py-0">
        <div className="flex flex-col justify-between gap-2 px-4 pt-4 pb-3 sm:flex-row sm:items-start">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-semibold">{tracker.title}</h2>
            <p className="text-xs text-muted-foreground">{tracker.address}</p>
            <p className="text-xs text-muted-foreground">
              {localAreaLabel(tracker)} · 移动端
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={Boolean(active)}
              onClick={() => setManagingKeywords(true)}
            >
              <Pencil data-icon="inline-start" />
              管理关键词
            </Button>
            <Button
              size="sm"
              disabled={!keywords.length || Boolean(active)}
              pending={start.isPending}
              onClick={() => setConfirm(crypto.randomUUID())}
            >
              <Play data-icon="inline-start" />
              {active ? "正在检查排名…" : "检查排名"}
            </Button>
          </div>
        </div>
        {active && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-4 py-2 text-sm text-muted-foreground">
            <Spinner className="size-3.5 text-primary" />
            <span>
              正在检查 {estimate.keywords} 个关键词、
              {estimate.points} 个采样点 · {searchesDone}/{estimate.searches}{" "}
              次搜索
            </span>
            <Progress
              className="w-24"
              aria-label="排名检查进度"
              value={searchesDone}
              max={estimate.searches}
            />
            <span>
              通常需要{" "}
              {checkDurationLabel(estimate.keywords, estimate.points)}
            </span>
          </div>
        )}
        {failed && (
          <div className="px-4 pb-3">
            <QueryError
              fallback={
                failed.error ??
                "上次检查没有返回排名。下方显示更早的结果。"
              }
            />
          </div>
        )}
        {keyword && (
          <LocalKeywordMap
            projectId={projectId}
            tracker={tracker}
            keyword={keyword}
            selectedScan={selectedScan}
            historical={selectedScan?.id !== latestScan?.id}
            search={search}
            onSearchChange={onSearchChange}
          />
        )}
        <div className="flex flex-wrap items-center gap-2 border-y border-border px-4 py-2">
          {historyAvailable && (
            <SegmentedToggle
              showLabels
              items={[
                {
                  value: "latest",
                  icon: <List className="size-3.5" />,
                  label: "最新数据",
                },
                {
                  value: "history",
                  icon: <CalendarDays className="size-3.5" />,
                  label: "历史记录",
                },
              ]}
              value={history ? "history" : "latest"}
              onChange={(value) =>
                onSearchChange({
                  keyword: keyword?.id,
                  view: value === "history" ? "history" : undefined,
                })
              }
            />
          )}
          <span className="text-sm text-muted-foreground">
            {keywords.length} 个关键词
          </span>
          {history && (
            <span className="ml-auto text-xs text-muted-foreground">
              找到时的平均排名
            </span>
          )}
        </div>
        <div className="p-4">
          <LocalKeywordsTable
            data={data}
            history={history}
            selectedKeywordId={keyword?.id}
            selectedScanId={selectedScan?.id}
            onSelect={(keywordId, scanId) =>
              onSearchChange({
                view: search.view,
                keyword: keywordId,
                scan: scanId,
              })
            }
            onManage={() => setManagingKeywords(true)}
          />
        </div>
      </Card>
      {managingKeywords && (
        <LocalKeywordsDialog
          projectId={projectId}
          trackerId={tracker.id}
          keywords={keywords}
          onClose={() => setManagingKeywords(false)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={`检查 ${estimate.keywords} 个关键词？`}
          confirmLabel="立即运行"
          pending={start.isPending}
          onConfirm={() => start.mutate(confirm)}
          onClose={() => setConfirm(null)}
        >
          {estimate.keywords} 个关键词{" "}
          &times; {estimate.points} 个网格点 = {estimate.searches} 次
          Google Maps 移动端搜索，大约需要{" "}
          {checkDurationLabel(estimate.keywords, estimate.points)}。费用最多{" "}
          <span className="font-mono font-semibold text-foreground">
            {/* Credits are $0.001, so three decimals show the exact maximum. */}
            {estimate.costUsd.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 3,
            })}
          </span>
          .
        </ConfirmDialog>
      )}
    </div>
  );
}
