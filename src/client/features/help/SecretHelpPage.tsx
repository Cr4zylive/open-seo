import type { ReactNode } from "react";
import { CopyButton } from "@/client/components/CopyButton";
import { PageHeader } from "@/client/components/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Separator } from "@/client/components/ui/separator";
import { isEveryAppClientAuthMode } from "@/lib/auth-mode";

export const helpLinkClassName =
  "font-medium text-primary underline underline-offset-4";

/** A terminal command with a copy button. */
export function CommandBlock({ command }: { command: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
      <pre className="min-w-0 flex-1 overflow-x-auto text-xs">
        <code>{command}</code>
      </pre>
      <CopyButton
        value={command}
        successMessage="命令已复制"
        label="复制命令"
        variant="ghost"
        size="icon-xs"
      />
    </div>
  );
}

/**
 * Instructions for setting one secret: the self-hosting steps, or on Every
 * App the steps for the gateway, which holds the key for every app.
 */
export function SecretHelpPage({
  title,
  intro,
  everyAppIntro,
  secretName,
  steps,
  everyAppSteps,
  dashboardPasteStep,
  terminalPromptHint,
}: {
  title: string;
  intro: ReactNode;
  /** The intro on Every App, where the gateway holds the key. */
  everyAppIntro: ReactNode;
  secretName: string;
  /** The `<li>` items of the "Steps" card. */
  steps: ReactNode;
  /** The `<li>` items of the "Steps" card on Every App. */
  everyAppSteps: ReactNode;
  dashboardPasteStep: ReactNode;
  terminalPromptHint: ReactNode;
}) {
  const everyApp = isEveryAppClientAuthMode();
  return (
    <div className="h-full overflow-auto px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <PageHeader
          title={title}
          description={everyApp ? everyAppIntro : intro}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>步骤</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5">
              {everyApp ? everyAppSteps : steps}
            </ol>
          </CardContent>
        </Card>

        {everyApp ? (
          <p className="text-sm text-muted-foreground">
            不是所有者或管理员？把此页发给他们。
          </p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Cloudflare Workers（控制台）</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  在 Cloudflare 中进入 <code>Compute</code> -&gt;{" "}
                  <code>Workers &amp; Pages</code>，打开你的 OpenSEO Worker。
                </li>
                <li>
                  打开 <code>Settings</code>。
                </li>
                <li>
                  进入 <code>Variables &amp; Secrets</code>，新增名为{" "}
                  <code>{secretName}</code> 的 secret。
                </li>
                <li>{dashboardPasteStep}</li>
              </ol>

              <Separator />

              <div>
                <p>也可以在终端用下面的命令设置同一个 secret：</p>
                <CommandBlock
                  command={`npx wrangler secret put ${secretName}`}
                />
              </div>
              <p className="text-muted-foreground">{terminalPromptHint}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
