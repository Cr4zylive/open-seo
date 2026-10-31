import type { CsvValue } from "@/client/lib/csv";
import { formatPlatformLabel } from "@/client/features/ai-search/platformLabels";
import type { BrandLookupResult } from "@/types/schemas/ai-search";

type CitationTab = "queries" | "pages";

type PageRow = BrandLookupResult["topPages"][number];
type QueryRow = BrandLookupResult["topQueries"][number];

export function buildBrandLookupExport(
  tab: CitationTab,
  sortedPages: PageRow[],
  sortedQueries: QueryRow[],
): { headers: string[]; rows: CsvValue[][] } {
  if (tab === "pages") {
    return {
      headers: [
        "URL",
        "域名",
        "平台",
        "来源提及量",
        "来源 AI 搜索量",
        "已获取样本中的提示词示例",
      ],
      rows: sortedPages.map((row) => [
        row.url,
        row.domain ?? "",
        formatPlatformLabel(row.platform),
        row.mentions ?? "",
        row.capturedVolume ?? "",
        row.keywords.map((keyword) => keyword.question).join("; "),
      ]),
    };
  }
  return {
    headers: ["查询", "平台", "AI 搜索量", "首次发现", "最近发现"],
    rows: sortedQueries.map((row) => [
      row.question,
      formatPlatformLabel(row.platform),
      row.aiSearchVolume ?? "",
      row.firstSeenAt ?? "",
      row.lastSeenAt ?? "",
    ]),
  };
}

export function brandLookupExportFilename(
  tab: CitationTab,
  resolvedTarget: string,
) {
  const slug = slugify(resolvedTarget);
  return tab === "pages"
    ? `ai-brand-lookup-pages-${slug}`
    : `ai-brand-lookup-queries-${slug}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
