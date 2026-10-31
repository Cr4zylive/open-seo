import {
  autumnSeoDataCreditsToUsd,
  creditsForProviderUsd,
} from "@/shared/billing";

// Cloudflare Browser Run bills browser time at $0.09 an hour. Every attempt is
// billed as its full timeout, not its measured time, so one attempt has one
// fixed price and the low end of the estimate is exact.
export const CLOUDFLARE_RENDER_TIMEOUT_MS = 20_000;
const CLOUDFLARE_USD_PER_BROWSER_HOUR = 0.09;
const CLOUDFLARE_USD_PER_ATTEMPT =
  (CLOUDFLARE_RENDER_TIMEOUT_MS / 3_600_000) * CLOUDFLARE_USD_PER_BROWSER_HOUR;
// Context.dev list price on the Developer plan. One scrape is one credit.
export const CONTEXT_USD_PER_CREDIT = 0.0025;

/**
 * Why a rendered audit can't start behind an Every App gateway: the Context
 * key is the gateway's, and optional in the manifest, so audits run
 * unrendered until an admin sets it once for every app. Plain text: it is
 * shown by ErrorState, toasts and MCP answers as is.
 */
export const GATEWAY_RENDERING_NOT_SET_UP_MESSAGE =
  "Every App 网关尚未配置 JavaScript 渲染。所有者或管理员可用 pnpm everyapp secret set CONTEXT_API_KEY 进行设置。";

/** Provider units a rendered audit used, counted per crawl chunk. */
export type RenderUsage = {
  cloudflareAttempts: number;
  contextCredits: number;
};

export function renderUsageCredits(usage: RenderUsage): number {
  return creditsForProviderUsd(
    usage.cloudflareAttempts * CLOUDFLARE_USD_PER_ATTEMPT +
      usage.contextCredits * CONTEXT_USD_PER_CREDIT,
  );
}

/**
 * Usage-credit range for rendering up to `maxPages` pages. The low end renders
 * every page on Cloudflare, which is what most sites cost. The high end is
 * every page falling back to Context after its Cloudflare attempt.
 */
export function estimateRenderingCredits(maxPages: number) {
  return {
    low: renderUsageCredits({
      cloudflareAttempts: maxPages,
      contextCredits: 0,
    }),
    high: renderUsageCredits({
      cloudflareAttempts: maxPages,
      contextCredits: maxPages,
    }),
  };
}

/**
 * What a hosted rendered audit holds when it starts, and the most it charges:
 * twice the Cloudflare-only estimate. Most pages render on Cloudflare, so
 * this covers almost every audit without holding the Context worst case.
 */
export function renderingHoldCredits(maxPages: number) {
  return estimateRenderingCredits(maxPages).low * 2;
}

/**
 * Usage credits as the dollars users see everywhere else. Rounded up to the
 * cent, so an account holding the shown amount always covers the hold.
 */
function formatRenderingUsd(credits: number) {
  const cents = Math.ceil(autumnSeoDataCreditsToUsd(credits * 100));
  return `$${(cents / 100).toFixed(2)}`;
}

/** Why a hosted account cannot start a rendered audit of `maxPages` pages. */
export function renderingCreditsNeededText(maxPages: number) {
  return `渲染最多 ${maxPages.toLocaleString("en-US")} 个页面需要账户有 ${formatRenderingUsd(renderingHoldCredits(maxPages))} 可用额度。请降低页面上限或充值额度。`;
}

export const RENDERING_COST_NOTE =
  "屏蔽浏览器的站点需要高级渲染器。如果费用高于预期，审计会自动停止。";

export function renderingCostText(maxPages: number) {
  return `费用最高 ${formatRenderingUsd(renderingHoldCredits(maxPages))}。`;
}

export function renderingEstimateText(maxPages: number) {
  return `${renderingCostText(maxPages)} ${RENDERING_COST_NOTE}`;
}
