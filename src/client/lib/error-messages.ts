import { FREE_MAX_AUDIT_PAGES } from "@/shared/audit-limits";
import { isErrorCode, type ErrorCode } from "@/shared/error-codes";
import {
  isEveryAppClientAuthMode,
  isHostedClientAuthMode,
} from "@/lib/auth-mode";

/**
 * Copy for an error we did not expect. Hosted users cannot read our logs, so
 * they get support; a self-hoster runs the server and can.
 */
export const UNEXPECTED_ERROR_MESSAGE = isHostedClientAuthMode()
  ? "我们这边出了点问题。请重试，如果一直失败请联系支持。"
  : "出现问题，请重试，或查看服务器日志了解详情。";

const STANDARD_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "请登录后重试。",
  AUTH_CONFIG_MISSING: isEveryAppClientAuthMode()
    ? "OpenSEO 现在连不上你的 Every App 网关。所有者或管理员可以用 pnpm everyapp status 检查设置。"
    : "OpenSEO 身份验证尚未配置，请按照 README 中的步骤配置 Cloudflare Access。",
  PAYMENT_REQUIRED:
    "使用 OpenSEO 需要有效的托管订阅。",
  INSUFFICIENT_CREDITS:
    "点数不足。请升级套餐或购买更多点数后续使用。",
  PAYMENT_METHOD_REQUIRED:
    "无法从已保存的卡片扣款。请到账单门户添加或更新卡片后再试。",
  PAYMENT_ACTION_REQUIRED:
    "银行需要更多时间或额外确认才能完成这笔扣款。请稍后再查看余额；如果点数没到账，先用「购买点数」完成首次充值，再开启自动续充。",
  AUDIT_RENDERING_UNAVAILABLE: isEveryAppClientAuthMode()
    ? "Every App 网关尚未配置 JavaScript 渲染。所有者或管理员可用 pnpm everyapp secret set CONTEXT_API_KEY 设置。"
    : "此部署尚未配置 JavaScript 渲染。请让管理员启用渲染器。",
  FORBIDDEN: "你无权访问此资源。",
  NOT_FOUND: "找不到请求的资源。",
  AUDIT_CAPACITY_REACHED:
    "当前账户已达到审计容量上限，请删除项目中的旧审计后再创建新审计。",
  AUDIT_PAGE_LIMIT_EXCEEDED: `免费套餐每次最多审计 ${FREE_MAX_AUDIT_PAGES} 个页面。升级后可运行更大规模的审计。`,
  AUDIT_ALREADY_RUNNING:
    "同时运行的审计已达上限，请等待完成或删除后再开始新审计。",
  VALIDATION_ERROR: "请检查输入内容后重试。",
  UNKNOWN_LOCATION:
    "找不到这个城市、县或地区。请从列表中选择位置，或清空该字段以搜索整个国家/地区。",
  CRAWL_TARGET_BLOCKED: "安全策略已阻止此抓取目标。",
  BACKLINKS_BILLING_ISSUE:
    "已连接的 DataForSEO 账户存在账单或余额问题。",
  AI_SEARCH_BILLING_ISSUE:
    "已连接的 DataForSEO 账户存在账单或余额问题。",
  AI_VISIBILITY_ERROR:
    "AI 可见度请求未能完成。请检查追踪设置后重试。",
  DATAFORSEO_AUTH_FAILED: isEveryAppClientAuthMode()
    ? "Every App 网关尚未配置 DataForSEO，或拒绝了其中的密钥。所有者或管理员可用 pnpm everyapp secret set DATAFORSEO_API_KEY 设置。"
    : "DataForSEO 拒绝了这些凭证。请确认 DATAFORSEO_API_KEY 是 DataForSEO 登录名和密码（login:password）的 Base64 编码，且账户已验证并开通 API。",
  RATE_LIMITED: "请求过于频繁，请稍后重试。",
  UPSTREAM_UNAVAILABLE:
    "数据提供商暂时不可用，请稍后重试。",
  CONFLICT: "此请求与现有数据冲突。",
  INTERNAL_ERROR: UNEXPECTED_ERROR_MESSAGE,
};

export function getStandardErrorMessage(
  error: unknown,
  fallback: string = STANDARD_MESSAGES.INTERNAL_ERROR,
): string {
  if (!(error instanceof Error)) return fallback;
  if (isErrorCode(error.message)) return STANDARD_MESSAGES[error.message];
  if (error.message) return error.message;
  return fallback;
}

export function getErrorCode(error: unknown): ErrorCode | null {
  if (!(error instanceof Error)) return null;
  return isErrorCode(error.message) ? error.message : null;
}
