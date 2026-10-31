import { AlertTriangle, Info } from "lucide-react";
import { SafeExternalLink } from "@/client/components/SafeExternalLink";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/client/components/ui/alert";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";

const EVERY_APP_GOOGLE_SETUP_URL =
  "https://everyapp.com/docs/providers/google#connect-accounts";

export function GoogleOAuthSetupWarning({
  integrationName,
  docsUrl,
}: {
  integrationName: string;
  docsUrl: string;
}) {
  if (isEveryAppClientAuthMode()) {
    // Google connects through the gateway, which holds the Google client;
    // OpenSEO holds none here (server/features/google/googleAccess.ts).
    return (
      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>先把 Google 加到 Every App</AlertTitle>
        <AlertDescription>
          <p>
            所有者或管理员做一次即可：用重定向 URI{" "}
            <code>
              https://&lt;your gateway&gt;/connect/google-workspace/callback
            </code>{" "}
            创建 Google OAuth 客户端，然后在 Every App 的 Manage workspace →
            Providers 中粘贴 client ID 和 secret，或运行{" "}
            <code>
              pnpm everyapp secret set GOOGLE_WORKSPACE_CLIENT_ID
              GOOGLE_WORKSPACE_CLIENT_SECRET
            </code>
            。然后再在这里连接 {integrationName}。
          </p>
          <SafeExternalLink
            url={EVERY_APP_GOOGLE_SETUP_URL}
            label="如何添加提供方"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
          />
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="warning">
      <AlertTriangle className="size-4" />
      <AlertTitle>未配置 Google OAuth 客户端</AlertTitle>
      <AlertDescription>
        <p>
          连接 {integrationName} 之前，请先把 Google client ID 和 secret
          加到此 OpenSEO 部署。
        </p>
        <SafeExternalLink
          url={docsUrl}
          label="打开设置指南"
          className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
        />
      </AlertDescription>
    </Alert>
  );
}
