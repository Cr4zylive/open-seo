import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "@/client/components/PageHeader";
import { ThemePreferenceRadio } from "@/client/components/ThemePreferenceMenuItems";
import { everyAppAccountQueryOptions } from "@/client/features/every-app/everyAppAccountQueries";
import { ApiKeySettings } from "@/client/features/settings/ApiKeySettings";
import { ChatProviderSettings } from "@/client/features/settings/ChatProviderSettings";
import { McpConnectionsSettings } from "@/client/features/settings/McpConnectionsSettings";
import { PrivacySettings } from "@/client/features/settings/PrivacySettings";
import {
  isEveryAppClientAuthMode,
  isHostedClientAuthMode,
  usesBetterAuthClient,
} from "@/lib/auth-mode";
import { version } from "../../../../package.json";

export const Route = createFileRoute("/_app/settings/")({
  component: PersonalSettings,
});

function PersonalSettings() {
  const isHosted = isHostedClientAuthMode();
  // API keys need Better Auth accounts (hosted or the standalone Docker
  // edition); the analytics choices only exist on hosted.
  const hasAccounts = usesBetterAuthClient();
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionHeader title="外观" />
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm">主题</span>
          <ThemePreferenceRadio />
        </div>
      </section>

      {isEveryAppClientAuthMode() ? <EveryAppSettings /> : null}

      {isHosted ? <McpConnectionsSettings /> : null}

      {hasAccounts ? <ApiKeySettings /> : null}

      {isHosted ? (
        <PrivacySettings />
      ) : (
        <>
          <ChatProviderSettings />
          <section className="space-y-3">
            <SectionHeader title="关于" />
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm">版本</span>
              <span className="font-mono text-sm text-muted-foreground">
                v{version}
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// Behind an Every App gateway, which owns the account, the team and the AI
// connections: say so, and link back.
function EveryAppSettings() {
  const { data: account } = useQuery(everyAppAccountQueryOptions());
  return (
    <section className="space-y-3">
      <SectionHeader title="Every App" />
      <p className="text-sm text-muted-foreground">
        你的账户、同事和 AI 连接在 Every App 上管理。
      </p>
      {account?.gatewayUrl ? (
        <a
          href={account.gatewayUrl}
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          打开 Every App →
        </a>
      ) : null}
    </section>
  );
}
