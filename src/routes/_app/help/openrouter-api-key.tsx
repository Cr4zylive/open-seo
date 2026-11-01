import { createFileRoute } from "@tanstack/react-router";
import {
  CommandBlock,
  helpLinkClassName,
  SecretHelpPage,
} from "@/client/features/help/SecretHelpPage";

const OPENROUTER_KEYS_URL = "https://openrouter.ai/settings/keys";

export const Route = createFileRoute("/_app/help/openrouter-api-key")({
  component: OpenrouterApiKeyHelpPage,
});

function OpenrouterApiKeyHelpPage() {
  const accountStep = (
    <li>
      在{" "}
      <a
        className={helpLinkClassName}
        href="https://openrouter.ai"
        target="_blank"
        rel="noreferrer"
      >
        openrouter.ai
      </a>{" "}
      创建账户并充值（按量付费，和 DataForSEO 类似）。
    </li>
  );
  const keyStep = (
    <li>
      前往{" "}
      <a
        className={helpLinkClassName}
        href={OPENROUTER_KEYS_URL}
        target="_blank"
        rel="noreferrer"
      >
        OpenRouter API Keys
      </a>{" "}
      并点击「Create API Key」。
    </li>
  );
  return (
    <SecretHelpPage
      title="设置 OpenRouter API 密钥"
      intro={
        <>
          OpenSEO 需要 <code>OPENROUTER_API_KEY</code> secret，SAM
          这类应用内 SEO 智能体才能运行。这是可选的——没有它，OpenSEO
          的其他功能照常工作。自托管也可以在「设置」里保存 Chat Base
          URL、API Key 和模型 id，把 SAM
          指到任意 OpenAI 兼容接口；环境变量只在第一次保存之前生效。
        </>
      }
      everyAppIntro="SAM、提示词建议和网站研究跑在 OpenRouter 上。在 Every App 上，网关为所有应用保存一次密钥。"
      secretName="OPENROUTER_API_KEY"
      steps={
        <>
          {accountStep}
          {keyStep}
          <li>
            把密钥保存为环境中的 <code>OPENROUTER_API_KEY</code> secret：
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Docker 自托管：<code>.env</code>
              </li>
              <li>Cloudflare：在 Workers 界面中设置（见下方）</li>
              <li>
                本地开发：<code>.env.local</code>
              </li>
            </ul>
          </li>
          <li>重启 OpenSEO。</li>
        </>
      }
      everyAppSteps={
        <>
          {accountStep}
          {keyStep}
          <li>
            所有者或管理员在 Every App 结账处运行此命令并粘贴密钥：
            <CommandBlock command="pnpm everyapp secret set OPENROUTER_API_KEY" />
          </li>
          <li>重新加载 OpenSEO。</li>
        </>
      }
      dashboardPasteStep="粘贴 OpenRouter API 密钥并保存。"
      terminalPromptHint="提示时粘贴 OpenRouter API 密钥。"
    />
  );
}
