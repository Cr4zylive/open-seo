import { CalendarDays, SlidersHorizontal, Table } from "lucide-react";
import { SegmentedToggle } from "@/client/components/SegmentedToggle";
import { ExportMenu } from "@/client/components/ExportMenu";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { Progress } from "@/client/components/ui/progress";
import { Spinner } from "@/client/components/ui/spinner";
import { MoreMenu } from "./ToolbarMenus";

export function RankTrackingTableToolbar({
  showFilters,
  onToggleFilters,
  activeFilterCount,
  isRunning,
  latestRun,
  keywordCount,
  viewMode,
  onViewModeChange,
  historyAvailable,
  onExport,
  onCheckNow,
  onRefreshMetrics,
  metricsRefreshing,
  trackedKeywordCount,
  checkBusy,
  checkDisabled,
  hasData,
}: {
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  isRunning: boolean;
  latestRun:
    | { status: string; keywordsChecked: number; keywordsTotal: number }
    | null
    | undefined;
  keywordCount: number;
  viewMode: "table" | "history";
  onViewModeChange: (v: "table" | "history") => void;
  historyAvailable: boolean;
  onExport: (action: "sheets" | "csv" | "copy-list") => void;
  onCheckNow: () => void;
  onRefreshMetrics: () => void;
  metricsRefreshing: boolean;
  trackedKeywordCount: number;
  checkBusy: boolean;
  checkDisabled: boolean;
  hasData: boolean;
}) {
  // Once every keyword has had its first check, a running run is retrying the
  // ones that errored or came back missing. Retries wait on DataForSEO's task
  // queue, so a full progress bar would sit there for up to an hour.
  const isDoubleChecking =
    latestRun?.status === "running" &&
    latestRun.keywordsTotal > 0 &&
    latestRun.keywordsChecked >= latestRun.keywordsTotal;

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-y border-border">
      {/* History needs at least two checks to compare; until then the toggle
          would only offer a worse copy of the Latest table. */}
      {historyAvailable && (
        <SegmentedToggle
          showLabels
          items={[
            {
              value: "table" as const,
              icon: <Table className="size-3.5" />,
              label: "最新数据",
            },
            {
              value: "history" as const,
              icon: <CalendarDays className="size-3.5" />,
              label: "历史记录",
            },
          ]}
          value={viewMode}
          onChange={onViewModeChange}
        />
      )}

      <Button
        variant="outline"
        size="sm"
        aria-pressed={showFilters}
        className="aria-pressed:bg-muted aria-pressed:text-foreground"
        onClick={onToggleFilters}
        title="显示或隐藏表格筛选条件"
      >
        <SlidersHorizontal data-icon="inline-start" />
        筛选
        {activeFilterCount > 0 && <Badge size="sm">{activeFilterCount}</Badge>}
      </Button>

      {isRunning && latestRun ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-3.5 text-primary" />
          {isDoubleChecking ? (
            <span>
              正在复核部分结果，最多可能需要一小时。
            </span>
          ) : (
            <>
              <span>
                {latestRun.status === "pending"
                  ? "准备中…"
                  : `正在获取 ${latestRun.keywordsTotal || "?"} 个关键词的排名…`}{" "}
                {latestRun.keywordsChecked}/{latestRun.keywordsTotal || "?"}
              </span>
              {latestRun.keywordsTotal > 0 && (
                <Progress
                  className="w-24"
                  aria-label="排名检查进度"
                  value={latestRun.keywordsChecked}
                  max={latestRun.keywordsTotal}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">
          {keywordCount} 个关键词
        </span>
      )}

      <div className="flex-1" />

      <ExportMenu
        actions={["sheets", "csv", "copy-list"]}
        copyListLabel="复制关键词"
        onExport={onExport}
        disabled={!hasData}
      />

      {/* Both actions need a paid plan; free users get the page's upgrade
          alert instead of a menu whose items fail. */}
      {!checkDisabled && (
        <MoreMenu
          onCheckNow={onCheckNow}
          checkBusy={checkBusy}
          onRefreshMetrics={onRefreshMetrics}
          metricsRefreshing={metricsRefreshing}
          trackedKeywordCount={trackedKeywordCount}
          hasData={hasData}
        />
      )}
    </div>
  );
}
