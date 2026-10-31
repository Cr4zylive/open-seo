import { describe, expect, it } from "vitest";
import {
  nextChatProviderRow,
  parseChatBaseUrl,
  resolveChatProvider,
} from "./chat-provider";

describe("resolveChatProvider", () => {
  it("uses env until a settings row exists", () => {
    expect(
      resolveChatProvider(null, {
        openRouterBaseUrl: "https://api.ooapi.cc/v1",
        apiKey: "env-key",
        modelId: "env-model",
      }),
    ).toEqual({
      baseUrl: "https://api.ooapi.cc/v1",
      apiKey: "env-key",
      modelId: "env-model",
    });
  });

  it("lets a saved base URL replace the env endpoint", () => {
    expect(
      resolveChatProvider(
        {
          baseUrl: "https://api.ooapi.cc/v1/",
          apiKey: "saved-key",
          modelId: "saved-model",
        },
        {
          chatBaseUrl: "https://env.example/v1",
          apiKey: "env-key",
          modelId: "env-model",
        },
      ),
    ).toEqual({
      baseUrl: "https://api.ooapi.cc/v1/",
      apiKey: "saved-key",
      modelId: "saved-model",
    });
  });
});

describe("nextChatProviderRow", () => {
  it("normalizes an ooapi base URL and keeps a blank key", () => {
    const next = nextChatProviderRow(
      { baseUrl: "", apiKey: "already-saved", modelId: "" },
      {
        baseUrl: "https://api.ooapi.cc/v1/",
        apiKey: "  ",
        modelId: " gateway-model ",
      },
    );

    expect(next).toEqual({
      ok: true,
      baseUrl: "https://api.ooapi.cc/v1",
      apiKey: "already-saved",
      modelId: "gateway-model",
    });
  });

  it("rejects a base URL that omits /v1", () => {
    expect(parseChatBaseUrl("https://api.ooapi.cc").ok).toBe(false);
  });
});
