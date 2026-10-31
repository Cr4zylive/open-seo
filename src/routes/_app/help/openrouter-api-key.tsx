import { createFileRoute } from "@tanstack/react-router";

const OPENROUTER_KEYS_URL = "https://openrouter.ai/settings/keys";

export const Route = createFileRoute("/_app/help/openrouter-api-key")({
  component: OpenrouterApiKeyHelpPage,
});

function OpenrouterApiKeyHelpPage() {
  return (
    <div className="px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-8 overflow-auto">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-3">
            <h1 className="text-2xl font-semibold">设置 OpenRouter API 密钥</h1>
            <p className="text-sm text-base-content/70">
              OpenSEO 的应用内 SEO 智能体 SAM 等 AI 功能需要
              <code className="mx-1">OPENROUTER_API_KEY</code>
              密钥。此项为可选配置，其他功能无需该密钥即可使用。自托管也可以把
              <code className="mx-1">CHAT_BASE_URL</code>
              指到任意 OpenAI 兼容接口，此时这个变量是该服务的 API 密钥，而不是
              OpenRouter 密钥。
            </p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-4">
            <h2 className="card-title text-base">操作步骤</h2>
            <ol className="list-decimal pl-5 text-sm space-y-3 text-base-content/80">
              <li>
                在{" "}
                <a
                  className="link link-primary"
                  href="https://openrouter.ai"
                  target="_blank"
                  rel="noreferrer"
                >
                  openrouter.ai
                </a>{" "}
                创建账户并充值，计费方式与 DataForSEO 类似，按量付费。
              </li>
              <li>
                打开{" "}
                <a
                  className="link link-primary"
                  href={OPENROUTER_KEYS_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  OpenRouter API 密钥页面
                </a>{" "}
                ，点击“Create API Key”。
              </li>
              <li>
                将密钥保存为当前环境中的
                <code className="mx-1">OPENROUTER_API_KEY</code> 密钥：
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>
                    Docker 自托管：<code>.env</code>
                  </li>
                  <li>Cloudflare：在 Workers 管理界面中设置，具体步骤见下方</li>
                  <li>
                    本地开发：<code>.env.local</code>
                  </li>
                </ul>
              </li>
              <li>重启 OpenSEO。</li>
            </ol>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-2 text-sm text-base-content/75">
            <h2 className="card-title text-base">
              Cloudflare Workers（管理界面）
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-base-content/80">
              <li>
                在 Cloudflare 中前往 <code>Compute</code> -&gt;{" "}
                <code>Workers &amp; Pages</code>
                ，然后打开你的 OpenSEO Worker。
              </li>
              <li>
                打开 <code>Settings</code>。
              </li>
              <li>
                前往 <code>Variables &amp; Secrets</code>，新增名为
                <code className="mx-1">OPENROUTER_API_KEY</code>。
              </li>
              <li>粘贴 OpenRouter API 密钥并保存。</li>
            </ol>

            <div className="divider my-1" />

            <p>也可以在终端中运行以下命令设置同一密钥：</p>
            <pre className="p-3 rounded bg-base-200 border border-base-300 overflow-x-auto text-xs">
              <code>npx wrangler secret put OPENROUTER_API_KEY</code>
            </pre>
            <p>出现提示后粘贴 OpenRouter API 密钥。</p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-3 text-sm text-base-content/75">
            <h2 className="card-title text-base">使用其他 OpenAI 兼容接口</h2>
            <p>
              自托管可以把 SAM 指到任意 OpenAI 兼容接口。Docker 写在{" "}
              <code>.env</code>，Cloudflare 自托管写在{" "}
              <code>.env.selfhost</code> 后重新部署：
            </p>
            <pre className="p-3 rounded bg-base-200 border border-base-300 overflow-x-auto text-xs">
              <code>{`CHAT_BASE_URL=https://api.ooapi.cc/v1
OPENROUTER_API_KEY=该服务的 API 密钥
OPENROUTER_MODEL=该网关要求的模型 id`}</code>
            </pre>
            <p>
              <code>CHAT_BASE_URL</code> 需要包含 <code>/v1</code>。
              <code className="mx-1">OPENROUTER_BASE_URL</code>
              是同一设置的别名，两个都填时以 <code>CHAT_BASE_URL</code> 为准。
              <code className="mx-1">OPENROUTER_MODEL</code>
              会作为请求里的模型 id 发给该网关。模型需要支持 OpenAI
              风格的工具调用，SAM 会调用工具。自定义接口不会返回 OpenRouter
              的用量费用，这笔花费按 0 记录。不设置 base URL 时仍然走
              OpenRouter。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
