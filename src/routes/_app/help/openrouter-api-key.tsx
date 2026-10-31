import { Link, createFileRoute } from "@tanstack/react-router";
import { ChatProviderSettings } from "@/client/features/settings/ChatProviderSettings";
import { isHostedClientAuthMode } from "@/lib/auth-mode";

export const Route = createFileRoute("/_app/help/openrouter-api-key")({
  component: OpenrouterApiKeyHelpPage,
});

function OpenrouterApiKeyHelpPage() {
  const isHosted = isHostedClientAuthMode();

  return (
    <div className="px-4 py-4 md:px-6 md:py-6 pb-24 md:pb-8 overflow-auto">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-3">
            <h1 className="text-2xl font-semibold">设置聊天模型</h1>
            <p className="text-sm text-base-content/70">
              SAM 的聊天接口在应用里保存。Chat Base URL 留空时使用
              OpenRouter。要接 ooapi 或其他 OpenAI 兼容接口，把地址写成带{" "}
              <code>/v1</code> 的形式，聊天 API Key 填该服务的密钥，模型 id
              填该网关要求的名字。
            </p>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body gap-4">
            {isHosted ? (
              <p className="text-sm text-base-content/70">
                当前是托管部署，聊天模型由平台配置。
              </p>
            ) : (
              <ChatProviderSettings />
            )}
            <p className="text-sm text-base-content/60">
              同一组字段也在{" "}
              <Link className="link link-primary" to="/settings">
                设置
              </Link>{" "}
              里。模型需要支持 OpenAI 风格的工具调用。自定义接口没有 OpenRouter
              的用量费用，这笔花费记为 0。还没在这里保存过时，已有的
              环境变量只会作为兜底。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
