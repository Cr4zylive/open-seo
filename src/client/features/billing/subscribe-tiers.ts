import {
  AGENCY_PLAN_OFFER,
  BASE_PLAN_OFFER,
  PRO_PLAN_OFFER,
  type PlanOffer,
} from "@/client/features/billing/plan-offers";

// The tiers on openseo.so/pricing, with the same copy. Its "Get started"
// links highlight one with ?plan=. Annual prices are the hidden yearly plans
// in Autumn, which support sets up by email until checkout can sell them.
export const TIERS = {
  base: {
    offer: BASE_PLAN_OFFER,
    annualPriceUsd: 100,
    description: "适合自己的网站。",
    features: [
      "关键词研究、反向链接、排名跟踪和网站审计",
      "AI 可见度、提示词研究和跟踪",
      "可在 Claude、Cursor 和 ChatGPT 中使用",
      "免费的 Google Search Console 数据",
    ],
  },
  pro: {
    offer: PRO_PLAN_OFFER,
    annualPriceUsd: 300,
    description: "适合自由职业者和成长中的团队。",
    features: [
      "包含基础套餐全部功能",
      "用量比付款金额多 20%",
      "优先邮件支持",
    ],
  },
  agency: {
    offer: AGENCY_PLAN_OFFER,
    annualPriceUsd: 2000,
    description: "适合服务大量客户的代理商。",
    features: [
      "包含专业套餐全部功能",
      "用量比付款金额多 20%",
      "专属 Slack Connect 频道",
      "AI 落地：协助团队配置智能体和工作流",
    ],
  },
} satisfies Record<
  string,
  {
    offer: PlanOffer;
    annualPriceUsd: number;
    description: string;
    features: string[];
  }
>;
export type Tier = keyof typeof TIERS;

export function isTier(value: unknown): value is Tier {
  return typeof value === "string" && Object.hasOwn(TIERS, value);
}
