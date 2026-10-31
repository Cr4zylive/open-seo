import { Sparkles } from "lucide-react";
import { Badge } from "@/client/components/ui/badge";
import { exportRows } from "@/client/lib/exportRows";
import { captureClientEvent } from "@/client/lib/posthog";
import { formatLocationLabel } from "@/shared/keyword-locations";
import type {
  RankTrackingDeviceResult,
  RankTrackingRow,
} from "@/types/schemas/rank-tracking";

const FEATURE_SHORT_LABELS: Record<string, string> = {
  featured_snippet: "FS",
  people_also_ask: "PAA",
  ai_overview: "AI",
  local_pack: "本地",
  knowledge_panel: "KP",
  video: "视频",
  images: "图片",
  shopping: "购物",
  top_stories: "新闻",
};

const FEATURE_TOOLTIPS: Record<string, string> = {
  featured_snippet:
    "精选摘要：搜索结果顶部突出显示的答案框",
  people_also_ask: "其他用户还问了：可展开的相关问题",
  ai_overview: "AI 摘要：搜索结果顶部由 AI 生成的摘要",
  local_pack: "本地结果包：包含本地商家列表的地图",
  knowledge_panel: "知识面板：实体相关信息框",
  video: "视频：SERP 中显示的视频结果",
  images: "图片：SERP 中显示的图片结果",
  shopping: "购物：包含价格的商品列表",
  top_stories: "焦点新闻：新闻文章轮播",
};

export function SerpFeatureTags({ features }: { features: string[] }) {
  const notable = features.filter((f) => f in FEATURE_SHORT_LABELS);
  if (notable.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {notable.map((f) => (
        <Badge
          key={f}
          variant="secondary"
          size="sm"
          className="cursor-help"
          title={FEATURE_TOOLTIPS[f] ?? f}
        >
          {f === "ai_overview" && <Sparkles />}
          {FEATURE_SHORT_LABELS[f]}
        </Badge>
      ))}
    </div>
  );
}

export function DeviceRankCell({
  result,
}: {
  result: RankTrackingDeviceResult;
}) {
  const { position, previousPosition } = result;

  // Nothing at all
  if (position === null && previousPosition === null) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Was ranking, now lost
  if (position === null && previousPosition !== null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="w-6 text-right font-mono text-xs text-muted-foreground">
          {previousPosition}
        </span>
        <span className="text-muted-foreground/60">→</span>
        <span className="font-mono rounded px-1.5 py-0.5 text-xs font-semibold bg-destructive/15 text-destructive">
          丢失
        </span>
      </span>
    );
  }

  // First check — no previous data
  if (previousPosition === null) {
    return <span className="font-mono">{position}</span>;
  }

  // Both exist — show old → new with colored badge
  const change = previousPosition - position!;
  let badgeClass = "bg-muted text-foreground";
  if (change > 0) badgeClass = "bg-success/20 text-success";
  if (change < 0) badgeClass = "bg-warning/20 text-warning";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-6 text-right font-mono text-xs text-muted-foreground">
        {previousPosition}
      </span>
      <span className="text-muted-foreground/60">→</span>
      <span
        className={`font-mono rounded px-1.5 py-0.5 text-xs font-semibold ${badgeClass}`}
      >
        {position}
      </span>
    </span>
  );
}

export function DeviceUrlCell({
  result,
  domain,
}: {
  result: RankTrackingDeviceResult;
  domain: string;
}) {
  if (!result.rankingUrl) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  return (
    <a
      href={toFullUrl(result.rankingUrl, domain)}
      target="_blank"
      rel="noopener noreferrer"
      className="block truncate text-xs hover:underline"
      title={result.rankingUrl}
    >
      {toPath(result.rankingUrl)}
    </a>
  );
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function VolumeCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="font-mono text-sm">{compactFormatter.format(value)}</span>
  );
}

export function CpcCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">-</span>;
  return <span className="font-mono text-sm">${value.toFixed(2)}</span>;
}

/** Numeric change for CSV export — numbers bypass the CSV formula-injection sanitizer */
export function csvChange(
  current: number | null,
  previous: number | null,
): number | string {
  if (previous === null) return current !== null ? "new" : "";
  if (current === null) return "lost";
  return previous - current;
}

function buildRankTrackingExport(
  sorted: RankTrackingRow[],
  showDesktop: boolean,
  showMobile: boolean,
  locationName?: string | null,
): { headers: string[]; rows: (string | number)[][] } {
  const headers = [
    "关键词",
    // Exports lack the table's tooltip, so name the city inline.
    locationName
      ? `本地搜索量（${formatLocationLabel(locationName, 2)}）`
      : "搜索量",
    "KD",
    "CPC",
    ...(showDesktop
      ? [
          "桌面端排名",
          "桌面端变化",
          "桌面端网址",
          "桌面端 SERP 功能",
        ]
      : []),
    ...(showMobile
      ? [
          "移动端排名",
          "移动端变化",
          "移动端网址",
          "移动端 SERP 功能",
        ]
      : []),
  ];
  // Emit empty cells (not "Not ranking" strings) so Sheets infers a numeric
  // column type and the user can sort by position.
  const rows = sorted.map((row) => [
    row.keyword,
    row.searchVolume ?? "",
    row.keywordDifficulty ?? "",
    row.cpc ?? "",
    ...(showDesktop
      ? [
          row.desktop.position ?? "",
          csvChange(row.desktop.position, row.desktop.previousPosition),
          row.desktop.rankingUrl ?? "",
          row.desktop.serpFeatures.join(", "),
        ]
      : []),
    ...(showMobile
      ? [
          row.mobile.position ?? "",
          csvChange(row.mobile.position, row.mobile.previousPosition),
          row.mobile.rankingUrl ?? "",
          row.mobile.serpFeatures.join(", "),
        ]
      : []),
  ]);
  return { headers, rows };
}

export function exportRankTracking(args: {
  format: "csv" | "sheets";
  rows: RankTrackingRow[];
  showDesktop: boolean;
  showMobile: boolean;
  domain: string;
  locationName?: string | null;
  scope?: "selection";
}) {
  const { format, scope } = args;
  const { headers, rows } = buildRankTrackingExport(
    args.rows,
    args.showDesktop,
    args.showMobile,
    args.locationName,
  );
  // CSV file download keeps cents-formatted CPC for human readability;
  // clipboard/Sheets export uses raw numbers (see buildRankTrackingExport).
  const exportedRows =
    format === "csv"
      ? rows.map((row) =>
          row.map((cell, idx) =>
            idx === 3 && typeof cell === "number" ? cell.toFixed(2) : cell,
          ),
        )
      : rows;
  void exportRows({
    format,
    feature: "rank_tracking",
    headers,
    rows: exportedRows,
    filename: `rank-tracking-${args.domain}${scope ? "-selected" : ""}`,
    scope,
  });
  if (format === "csv" && rows.length > 0) {
    captureClientEvent("rank_tracking:export_csv", scope ? { scope } : {});
  }
}

function toPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function toFullUrl(url: string, domain: string): string {
  if (url.startsWith("http")) return url;
  return `https://${domain}${url}`;
}
