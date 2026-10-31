import type { KeywordIntent } from "@/types/keywords";
import { Badge } from "@/client/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/client/components/ui/tooltip";

const VARIANTS: Record<
  KeywordIntent,
  "info" | "warning" | "success" | "soft" | "secondary"
> = {
  informational: "info",
  commercial: "warning",
  transactional: "success",
  navigational: "soft",
  unknown: "secondary",
};

const SHORT_LABELS: Record<KeywordIntent, string> = {
  informational: "Info",
  commercial: "Comm",
  transactional: "Trans",
  navigational: "Nav",
  unknown: "?",
};

/** Full intent labels, shared with the keyword filters so both stay in sync. */
export const INTENT_LABELS: Record<KeywordIntent, string> = {
  informational: "信息型",
  commercial: "商业型",
  transactional: "交易型",
  navigational: "导航型",
  unknown: "未知",
};

const DESCRIPTIONS: Record<
  KeywordIntent,
  { label: string; description: string }
> = {
  informational: {
    label: INTENT_LABELS.informational,
    description: "搜索者希望获取信息或答案，适合教育内容、指南和简明对比说明。",
  },
  commercial: {
    label: INTENT_LABELS.commercial,
    description: "搜索者正在购买前比较方案，适合对比、替代方案和产品导向页面。",
  },
  transactional: {
    label: INTENT_LABELS.transactional,
    description:
      "搜索者准备完成购买等操作，应优先提供清晰的优惠、价格、试用或转化路径。",
  },
  navigational: {
    label: INTENT_LABELS.navigational,
    description: "搜索者正在寻找特定网站、品牌或页面，内容应准确匹配预期入口。",
  },
  unknown: {
    label: INTENT_LABELS.unknown,
    description: "此关键词暂无搜索意图数据，请结合其他信息制定内容策略。",
  },
};

export function IntentBadge({ intent }: { intent: KeywordIntent }) {
  const details = DESCRIPTIONS[intent];

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Badge
            variant={VARIANTS[intent]}
            tabIndex={0}
            className="h-6 min-w-11 cursor-help font-semibold"
          />
        }
        aria-label={`${details.label}搜索意图`}
      >
        {SHORT_LABELS[intent]}
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start gap-1">
        <span className="font-semibold">{details.label}</span>
        <span>{details.description}</span>
      </TooltipContent>
    </Tooltip>
  );
}
