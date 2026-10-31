import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import {
  getChatProviderSettings,
  saveChatProviderSettingsFn,
} from "@/serverFunctions/chatProvider";

export function ChatProviderSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["chatProviderSettings"],
    queryFn: () => getChatProviderSettings(),
  });
  const saved = settingsQuery.data;

  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelId, setModelId] = useState("");

  useEffect(() => {
    if (!saved) return;
    setBaseUrl(saved.baseUrl);
    setModelId(saved.modelId);
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveChatProviderSettingsFn({ data: { baseUrl, apiKey, modelId } }),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("聊天模型已保存");
      setApiKey("");
      void queryClient.invalidateQueries({
        queryKey: ["chatProviderSettings"],
      });
      void queryClient.invalidateQueries({ queryKey: ["samAccessStatus"] });
    },
    onError: (error) => {
      toast.error(getStandardErrorMessage(error));
    },
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-base-content/50">聊天模型</h2>
      <p className="text-sm text-base-content/70">
        SAM 使用这里保存的配置。Chat Base URL 留空则走 OpenRouter。填写 OpenAI
        兼容地址时需带 <code>/v1</code>，例如{" "}
        <code>https://api.ooapi.cc/v1</code>
        。模型需要支持 OpenAI 风格的工具调用。自定义接口不返回用量费用，花费记为
        0。
      </p>
      {saved && !saved.saved ? (
        <p className="text-sm text-base-content/60">
          尚未保存。保存之前，如果环境里已经有密钥或地址，SAM 会暂时使用它们。
        </p>
      ) : null}
      <label className="form-control w-full gap-1">
        <span className="text-sm">Chat Base URL</span>
        <input
          className="input input-bordered input-sm w-full"
          value={baseUrl}
          placeholder="https://api.ooapi.cc/v1"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setBaseUrl(event.currentTarget.value)}
        />
      </label>
      <label className="form-control w-full gap-1">
        <span className="text-sm">聊天 API Key</span>
        <input
          className="input input-bordered input-sm w-full"
          type="password"
          value={apiKey}
          placeholder={
            saved?.apiKeyConfigured
              ? "已保存，留空则不修改"
              : "OpenRouter 密钥，或兼容接口的 API Key"
          }
          autoComplete="off"
          onChange={(event) => setApiKey(event.currentTarget.value)}
        />
      </label>
      <label className="form-control w-full gap-1">
        <span className="text-sm">模型 id</span>
        <input
          className="input input-bordered input-sm w-full"
          value={modelId}
          placeholder="该网关要求的模型 id"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setModelId(event.currentTarget.value)}
        />
      </label>
      <div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={saveMutation.isPending || !saved}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "正在保存…" : "保存"}
        </button>
      </div>
      {settingsQuery.isError ? (
        <p className="text-sm text-error">
          {getStandardErrorMessage(settingsQuery.error)}
        </p>
      ) : null}
    </section>
  );
}
