import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { selectChatBaseUrl } from "@/shared/chat-base-url";
import { buildChatAgentModel, buildChatAgentModelFromEnv } from "./openrouter";

const mocks = vi.hoisted(() => ({
  createOpenRouter: vi.fn(),
  model: vi.fn(),
}));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: mocks.createOpenRouter,
}));

describe("buildChatAgentModel", () => {
  beforeEach(() => {
    mocks.model.mockReturnValue({ modelId: "test" });
    mocks.createOpenRouter.mockReturnValue(mocks.model);
  });

  it("keeps the OpenRouter request shape when no custom base URL is set", () => {
    buildChatAgentModel("or-key", undefined, "max");

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({ apiKey: "or-key" });
    expect(mocks.model).toHaveBeenCalledWith("openai/gpt-5.6-luna", {
      usage: { include: true },
      extraBody: { reasoning: { effort: "max" } },
    });
  });

  it("keeps MiniMax provider routing on the OpenRouter path", () => {
    buildChatAgentModel("or-key", "minimax/minimax-m3", "low");

    expect(mocks.model).toHaveBeenCalledWith("minimax/minimax-m3", {
      usage: { include: true },
      reasoning: { effort: "low" },
      provider: {
        order: ["together", "atlas-cloud/fp8"],
        zdr: true,
        allow_fallbacks: true,
      },
    });
  });

  it("points a custom base URL at that host and drops OpenRouter-only options", () => {
    buildChatAgentModel(
      "ooapi-key",
      "gpt-4o-mini",
      "max",
      "https://api.ooapi.cc/v1",
    );

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({
      apiKey: "ooapi-key",
      baseURL: "https://api.ooapi.cc/v1",
      compatibility: "compatible",
    });
    expect(mocks.model.mock.calls[0]).toEqual(["gpt-4o-mini"]);
  });

  it("drops MiniMax routing when the same slug is sent to a custom endpoint", () => {
    buildChatAgentModel(
      "ooapi-key",
      "minimax/minimax-m3",
      "max",
      "https://api.ooapi.cc/v1/",
    );

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({
      apiKey: "ooapi-key",
      baseURL: "https://api.ooapi.cc/v1/",
      compatibility: "compatible",
    });
    expect(mocks.model.mock.calls[0]).toEqual(["minimax/minimax-m3"]);
  });

  it("sends a placeholder bearer when a custom endpoint has no API key", () => {
    buildChatAgentModel("", "qwen3.5-9b", "max", " http://localhost:8000/v1 ");

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({
      apiKey: "local",
      baseURL: "http://localhost:8000/v1",
      compatibility: "compatible",
    });
  });
});

describe("buildChatAgentModelFromEnv", () => {
  beforeEach(() => {
    mocks.model.mockReturnValue({ modelId: "test" });
    mocks.createOpenRouter.mockReturnValue(mocks.model);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays on OpenRouter when only OPENROUTER_API_KEY is set", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "or-key");
    vi.stubEnv("CHAT_BASE_URL", "");
    vi.stubEnv("OPENROUTER_BASE_URL", "");
    vi.stubEnv("OPENROUTER_MODEL", "");

    buildChatAgentModelFromEnv({});

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({ apiKey: "or-key" });
    expect(mocks.model).toHaveBeenCalledWith("openai/gpt-5.6-luna", {
      usage: { include: true },
      extraBody: { reasoning: { effort: "max" } },
    });
  });

  it("targets CHAT_BASE_URL with the key and OPENROUTER_MODEL", () => {
    vi.stubEnv("CHAT_BASE_URL", "https://api.ooapi.cc/v1");
    vi.stubEnv("OPENROUTER_BASE_URL", "https://ignored.example/v1");
    vi.stubEnv("OPENROUTER_API_KEY", "ooapi-key");
    vi.stubEnv("OPENROUTER_MODEL", "gateway-model");

    buildChatAgentModelFromEnv({});

    expect(mocks.createOpenRouter).toHaveBeenCalledWith({
      apiKey: "ooapi-key",
      baseURL: "https://api.ooapi.cc/v1",
      compatibility: "compatible",
    });
    expect(mocks.model.mock.calls[0]).toEqual(["gateway-model"]);
  });

  it("accepts OPENROUTER_BASE_URL when CHAT_BASE_URL is unset", () => {
    vi.stubEnv("CHAT_BASE_URL", "");
    vi.stubEnv("OPENROUTER_BASE_URL", "https://api.ooapi.cc/v1");
    vi.stubEnv("OPENROUTER_API_KEY", "ooapi-key");
    vi.stubEnv("OPENROUTER_MODEL", "gateway-model");

    buildChatAgentModelFromEnv({});

    expect(mocks.createOpenRouter).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: "https://api.ooapi.cc/v1" }),
    );
  });

  it("refuses to build when neither a key nor a custom base URL is set", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("CHAT_BASE_URL", "");
    vi.stubEnv("OPENROUTER_BASE_URL", "");

    expect(() => buildChatAgentModelFromEnv({})).toThrow(/OPENROUTER_API_KEY/);
  });
});

describe("selectChatBaseUrl", () => {
  it("prefers CHAT_BASE_URL and treats a blank value as unset", () => {
    expect(
      selectChatBaseUrl(
        " https://api.ooapi.cc/v1 ",
        "https://other.example/v1",
      ),
    ).toBe("https://api.ooapi.cc/v1");
    expect(selectChatBaseUrl("  ", "https://other.example/v1")).toBe(
      "https://other.example/v1",
    );
    expect(selectChatBaseUrl(undefined, "  ")).toBeUndefined();
  });
});
