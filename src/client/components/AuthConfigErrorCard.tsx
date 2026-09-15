import { ShieldAlert } from "lucide-react";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

const HOSTED_SETUP_GUIDE_URL =
  "https://github.com/every-app/open-seo/blob/main/docs/SELF_HOSTING_CLOUDFLARE.md";
const ACCESS_AUD_GUIDE_URL =
  "https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/#get-your-aud-tag";

type AuthConfigErrorCardProps = {
  message: string;
  onRetry?: () => void;
};

export function AuthConfigErrorCard({
  message,
  onRetry,
}: AuthConfigErrorCardProps) {
  const isHostedMode = isHostedClientAuthMode();

  return (
    <div className="card w-full max-w-2xl bg-base-100 border border-base-300 shadow-xl">
      <div className="card-body gap-4">
        <h2 className="card-title gap-2">
          <ShieldAlert className="size-5 text-error" />
          需要配置身份验证
        </h2>

        <div className="alert alert-error">
          <span>{message}</span>
        </div>

        {isHostedMode ? (
          <p className="text-sm text-base-content/70">
            托管模式需要在部署环境中设置{" "}
            <code className="mx-1">BETTER_AUTH_SECRET</code>
            （至少 32 个字符）、<code className="mx-1">BETTER_AUTH_URL</code>和
            Google OAuth 凭据。
          </p>
        ) : (
          <p className="text-sm text-base-content/70">
            在 Worker「设置 → 变量和密钥」里填写
            <code className="mx-1">TEAM_DOMAIN</code>
            （形如 <code>https://你的团队.cloudflareaccess.com</code>）和
            <code className="mx-1">POLICY_AUD</code>
            。AUD 从 Zero Trust → Access 应用 → Configure → Additional settings
            的 Application Audience (AUD) Tag 复制。
          </p>
        )}

        <div className="card-actions justify-end">
          {onRetry ? (
            <button className="btn btn-ghost btn-sm" onClick={onRetry}>
              重试
            </button>
          ) : null}
          <a
            className="btn btn-primary btn-sm"
            href={isHostedMode ? HOSTED_SETUP_GUIDE_URL : ACCESS_AUD_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
          >
            打开设置指南
          </a>
        </div>
      </div>
    </div>
  );
}
