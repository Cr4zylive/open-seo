import { Package } from "lucide-react";
import { CopyButton } from "./SetupControls";

export const AGENT_SETUP_DESCRIPTION =
  "把这段提示词粘贴到你的 AI 智能体，即可自动完成 OpenSEO 配置。";

export function AgentSetupPanel({
  prompt,
  onCopy,
}: {
  prompt: string;
  onCopy?: () => void;
}) {
  return (
    <>
      <div className="rounded-xl border border-base-300 bg-base-200/25 p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-100">
            <Package className="size-5 text-base-content/70" />
          </span>
          <div>
            <p className="text-sm font-medium">OpenSEO 插件</p>
            <p className="mt-1 text-xs text-base-content/55">
              MCP 连接 + SEO 技能
            </p>
          </div>
        </div>
        <div className="[&>button]:h-11 [&>button]:w-full [&>button]:gap-2 [&>button]:text-sm">
          <CopyButton
            primary
            value={prompt}
            label="复制配置提示词"
            successMessage="已复制配置提示词"
            onCopy={onCopy}
          />
        </div>
      </div>
      <div className="mt-4 text-center">
        <a
          href="https://openseo.so/docs/mcp"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-base-content/60 underline decoration-base-content/25 underline-offset-4 hover:text-base-content"
        >
          手动配置
        </a>
      </div>
    </>
  );
}
