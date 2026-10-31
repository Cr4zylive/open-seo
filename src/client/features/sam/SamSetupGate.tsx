import { Link } from "@tanstack/react-router";
import { ShieldAlert, Wrench } from "lucide-react";

export function SamSetupGate({
  errorMessage,
  isRefetching,
  onRetry,
}: {
  errorMessage: string | null;
  isRefetching: boolean;
  onRetry: () => void;
}) {
  return (
    <section>
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6 md:p-7 space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-warning/15 p-2.5 text-warning shrink-0">
            <Wrench className="size-5" />
          </div>
          <div className="max-w-3xl space-y-1.5">
            <h2 className="text-xl font-semibold">启用 AI 功能</h2>
            <div className="text-sm text-base-content/68">
              OpenSEO 内置 AI 智能体 SAM 需要一个聊天模型。请在设置页填写聊天
              API Key。使用 OpenAI 兼容接口时，Chat Base URL 填带{" "}
              <code>/v1</code> 的地址（例如 <code>https://api.ooapi.cc/v1</code>
              ），模型 id 填该网关要求的名字。保存后在此确认。
            </div>
            <div className="text-xs text-base-content/50">
              填写位置：{" "}
              <Link
                className="underline underline-offset-2 hover:text-base-content/70"
                to="/settings"
              >
                设置
              </Link>
              ，或{" "}
              <Link
                className="underline underline-offset-2 hover:text-base-content/70"
                to="/help/openrouter-api-key"
              >
                聊天模型设置
              </Link>
              。
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn btn-primary"
            onClick={onRetry}
            disabled={isRefetching}
          >
            {isRefetching ? "正在确认…" : "确认 API 密钥"}
          </button>
          <Link className="btn" to="/settings">
            打开设置
          </Link>
        </div>

        {errorMessage ? (
          <div className="alert alert-warning">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
