import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  resolveRuntimeChatProvider: vi.fn(),
  getOpenRouterAccess: vi.fn(),
  buildChatAgentModel: vi.fn(),
  buildChatAgentModelFromResolved: vi.fn(),
}));

vi.mock("./ChatProviderService", () => ({
  resolveRuntimeChatProvider: mocks.resolveRuntimeChatProvider,
}));
vi.mock("@/server/lib/openrouter", () => ({
  getOpenRouterAccess: mocks.getOpenRouterAccess,
  buildChatAgentModel: mocks.buildChatAgentModel,
  buildChatAgentModelFromResolved: mocks.buildChatAgentModelFromResolved,
}));
vi.mock("@/server/lib/runtime-env", () => ({
  getWorkersEnv: async () => mocks.env,
  getEnvValueSync: (env: object, name: string): string | undefined => {
    const value: unknown = Reflect.get(env, name);
    return typeof value === "string" ? value : undefined;
  },
}));

import { requireChatAgentModel } from "./ChatAgentModelService";

describe("requireChatAgentModel", () => {
  beforeEach(() => {
    mocks.env = {};
    mocks.getOpenRouterAccess.mockReturnValue(null);
    mocks.buildChatAgentModelFromResolved.mockReturnValue({
      modelId: "saved-chat-model",
    });
    mocks.buildChatAgentModel.mockReturnValue({ modelId: "fallback-model" });
  });

  it("prefers saved Chat settings, including a custom base URL", async () => {
    const resolved = {
      baseUrl: "https://api.ooapi.cc/v1",
      apiKey: "ooapi-key",
      modelId: "gateway-model",
    };
    mocks.resolveRuntimeChatProvider.mockResolvedValue(resolved);

    await expect(requireChatAgentModel("low")).resolves.toMatchObject({
      modelId: "saved-chat-model",
    });

    expect(mocks.buildChatAgentModelFromResolved).toHaveBeenCalledWith(
      resolved,
      "low",
    );
    expect(mocks.getOpenRouterAccess).not.toHaveBeenCalled();
  });

  it("keeps the legacy gateway fallback", async () => {
    const gatewayFetch = vi.fn();
    mocks.env = { AUTH_MODE: "everyapp" };
    mocks.resolveRuntimeChatProvider.mockResolvedValue({
      modelId: "gateway-model",
    });
    mocks.getOpenRouterAccess.mockReturnValue({ gatewayFetch });

    await requireChatAgentModel("max");

    expect(mocks.buildChatAgentModel).toHaveBeenCalledWith(
      { gatewayFetch },
      "gateway-model",
      "max",
    );
  });

  it("points self-hosters at Chat settings when no provider is configured", async () => {
    mocks.env = { AUTH_MODE: "cloudflare_access" };
    mocks.resolveRuntimeChatProvider.mockResolvedValue({});

    await expect(requireChatAgentModel("low")).rejects.toThrow(
      /设置.*Chat Base URL.*API Key.*模型/,
    );
  });
});
