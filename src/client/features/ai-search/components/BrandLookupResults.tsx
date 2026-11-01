import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { Info, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle } from "@/client/components/ui/alert";
import { Badge } from "@/client/components/ui/badge";
import { Card } from "@/client/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/client/components/ui/tooltip";
import { DomainLevelBadge } from "@/client/features/ai-search/components/DomainLevelBadge";
import { BrandLookupMentionTrendCard } from "@/client/features/ai-search/components/BrandLookupMentionTrendCard";
import { BrandLookupShareOfVoice } from "@/client/features/ai-search/components/BrandLookupShareOfVoice";
import { CitationTabsCard } from "@/client/features/ai-search/components/BrandLookupCitationsCard";
import {
  formatCount,
  formatPlatformLabel,
  PLATFORM_DOT_CLASS,
} from "@/client/features/ai-search/platformLabels";
import type { BrandLookupResult } from "@/types/schemas/ai-search";
import { RESEARCH_SCOPE_LABELS } from "@/shared/researchScope";

type Props = {
  result: BrandLookupResult;
  projectId: string;
};

const DOMAIN_LEVEL_TIP =
  "AI 搜索提供商按域名报告提及次数，而不是按页面。此数字覆盖整个域名——下方的引用页面已限定在你选择的范围内。";

export function BrandLookupResults({ result, projectId }: Props) {
  if (!result.hasData) {
    const erroredPlatforms = result.perPlatform.filter(
      (p) => p.status === "error",
    );
    const allPlatformsErrored =
      erroredPlatforms.length === result.perPlatform.length &&
      result.perPlatform.length > 0;

    if (allPlatformsErrored) {
      return (
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle className="font-normal">
            <strong>{result.resolvedTarget}</strong>{" "}
            的 AI 提及数据暂时不可用。请稍后重试。
          </AlertTitle>
        </Alert>
      );
    }
    return (
      <div className="space-y-3">
        <Alert variant="info">
          <Info aria-hidden />
          <AlertTitle className="font-normal">
            未找到 <strong>{result.resolvedTarget}</strong> 的 AI 提及。
          </AlertTitle>
        </Alert>
        {erroredPlatforms.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            说明：{" "}
            {erroredPlatforms
              .map((p) => formatPlatformLabel(p.platform))
              .join(" 和 ")}{" "}
            暂时不可用，部分提及可能缺失。
          </p>
        ) : null}
      </div>
    );
  }

  const hasTrendData = result.monthlyVolume.length > 0;
  const sov = result.shareOfVoice;

  return (
    <Card className="gap-0 py-0">
      <BrandHeader result={result} />

      {/* One shared grid so the panels align by construction: stats left,
          trend right, Share of Voice flowing into the next free half-width
          cell — whichever of trend/SoV is absent, the rest stay
          column-aligned. A lone stats panel keeps full width instead of half a
          grid. */}
      <div
        className={
          hasTrendData || sov
            ? "grid gap-3 px-4 pb-4 lg:grid-cols-2"
            : "px-4 pb-4"
        }
      >
        <StatsCard result={result} />
        {hasTrendData ? <MentionTrendCard result={result} /> : null}
        {sov ? (
          <BrandLookupShareOfVoice
            shareOfVoice={sov}
            isDomainLevel={result.aggregatesAreDomainLevel}
          />
        ) : null}
      </div>

      <div className="px-4 pb-4">
        <CitationTabsCard result={result} projectId={projectId} />
      </div>
    </Card>
  );
}

function BrandHeader({ result }: { result: BrandLookupResult }) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold break-all">
          {result.resolvedTarget}
        </h2>
        <Badge variant="secondary">{result.detectedTargetType}</Badge>
        {result.scope ? (
          <Badge variant="outline">{RESEARCH_SCOPE_LABELS[result.scope]}</Badge>
        ) : null}
      </div>
      <p className="ml-auto text-xs text-muted-foreground">
        更新于 {formatRelative(result.fetchedAt)}
      </p>
    </section>
  );
}

function StatsCard({ result }: { result: BrandLookupResult }) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-border p-3">
      {result.aggregatesAreDomainLevel && (
        <div className="mb-2">
          <DomainLevelBadge tooltip={DOMAIN_LEVEL_TIP} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>平台</TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1">
                提及
                <InfoTooltip text="提及你的品牌或引用你网站的 AI 回答。" />
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center gap-1">
                AI 搜索量
                <InfoTooltip text="品牌出现在 AI 回答中的提示词的预估月度搜索量。" />
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="font-medium">
            <TableCell>合计</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(result.totalMentions)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(result.totalAiSearchVolume)}
            </TableCell>
          </TableRow>
          {result.perPlatform.map((row) => (
            <TableRow key={row.platform}>
              <TableCell>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-1.5 rounded-full ${PLATFORM_DOT_CLASS[row.platform]}`}
                  />
                  {formatPlatformLabel(row.platform)}
                  {row.platform === "chat_gpt" && (
                    <InfoTooltip text="ChatGPT 数据仅覆盖美国英语。" />
                  )}
                  {row.status === "error" && (
                    <span className="text-destructive">不可用</span>
                  )}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(row.status === "error" ? null : row.mentions)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCount(
                  row.status === "error" ? null : row.aiSearchVolume,
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MentionTrendCard({ result }: { result: BrandLookupResult }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium">提及趋势（最近 12 个月）</h3>
        {result.aggregatesAreDomainLevel ? (
          <DomainLevelBadge tooltip={DOMAIN_LEVEL_TIP} />
        ) : null}
      </div>
      <div className="p-4">
        <BrandLookupMentionTrendCard result={result} />
      </div>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={150}
        aria-label="更多信息"
        className="inline-flex rounded-sm text-muted-foreground/70 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Info className="size-3" />
      </TooltipTrigger>
      <TooltipContent className="normal-case tracking-normal font-normal">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "刚刚";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} 天前`;
}
