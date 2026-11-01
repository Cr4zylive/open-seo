import { generateText, Output, tool } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { resolveChatProvider } from "@/shared/chat-provider";
import { CUSTOM_CHAT_SUBMIT_TOOL } from "./custom-chat-endpoint-middleware";
import {
  buildChatAgentModel,
  buildChatAgentModelFromResolved,
} from "./openrouter";

const topicSchema = z.object({ topic: z.string() });

const requestSchema = z.object({
  model: z.string(),
  temperature: z.number().optional(),
  tool_choice: z.string().optional(),
  response_format: z
    .object({
      type: z.string(),
      json_schema: z.object({ strict: z.boolean().optional() }).optional(),
    })
    .optional(),
  tools: z
    .array(z.object({ function: z.object({ name: z.string() }) }))
    .optional(),
});

function completion(content: string) {
  return Response.json({
    choices: [
      {
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  });
}

function submitToolCompletion(payload: unknown) {
  return Response.json({
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: CUSTOM_CHAT_SUBMIT_TOOL,
                arguments: JSON.stringify(payload),
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
  });
}

function fetchUrl(input: RequestInfo | URL | undefined): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  throw new Error("fetch was not called with a URL");
}

function customModel(modelId: string) {
  return buildChatAgentModelFromResolved(
    resolveChatProvider(
      {
        baseUrl: "https://api.ooapi.cc/v1",
        apiKey: "ooapi-key",
        modelId,
      },
      {},
    ),
    "low",
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function objectCall(modelId: string, content: string) {
  const fetchMock = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(completion(content));
  const result = await generateText({
    model: customModel(modelId),
    output: Output.object({ schema: topicSchema }),
    prompt: "hi",
    maxRetries: 0,
  });
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  const body = requestSchema.parse(JSON.parse(z.string().parse(init?.body)));
  return {
    result,
    body,
    url: fetchUrl(url),
    calls: fetchMock.mock.calls.length,
  };
}

describe("custom base URL structured output", () => {
  it.each(["claude-sonnet-5-5", "gpt-4o-mini"])(
    "asks %s to submit a tool and parses plain JSON text",
    async (modelId) => {
      const { result, body, url, calls } = await objectCall(
        modelId,
        '{"topic":"seo"}',
      );

      expect(calls).toBe(1);
      expect(url).toBe("https://api.ooapi.cc/v1/chat/completions");
      expect(body.model).toBe(modelId);
      expect(body.response_format).toBeUndefined();
      expect(body.temperature).toBeUndefined();
      expect(body.tool_choice).toBe("auto");
      expect(body.tools?.map((entry) => entry.function.name)).toEqual([
        CUSTOM_CHAT_SUBMIT_TOOL,
      ]);
      expect(result.output).toEqual({ topic: "seo" });
    },
  );

  it("parses a Claude reply that is only a json fence", async () => {
    const { result, body } = await objectCall(
      "claude-sonnet-5-5",
      '```json\n{\n  "topic": "seo"\n}\n```',
    );

    expect(body.model).toBe("claude-sonnet-5-5");
    expect(body.response_format).toBeUndefined();
    expect(body.tools?.map((entry) => entry.function.name)).toEqual([
      CUSTOM_CHAT_SUBMIT_TOOL,
    ]);
    expect(result.output).toEqual({ topic: "seo" });
  });

  it("parses submit-tool arguments as the object", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(submitToolCompletion({ topic: "rank tracker" }));
    const result = await generateText({
      model: customModel("claude-sonnet-5-5"),
      output: Output.object({ schema: topicSchema }),
      prompt: "hi",
      maxRetries: 0,
    });
    const body = requestSchema.parse(
      JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body)),
    );

    expect(body.response_format).toBeUndefined();
    expect(body.tool_choice).toBe("auto");
    expect(result.output).toEqual({ topic: "rank tracker" });
  });

  it("still rejects an object that does not match the schema", async () => {
    await expect(objectCall("gpt-4o-mini", '{"topic":1}')).rejects.toThrow(
      /did not match schema/,
    );
  });

  it("still throws when the reply has no JSON to parse", async () => {
    await expect(
      objectCall("claude-sonnet-5-5", "I cannot return JSON."),
    ).rejects.toThrow(/could not parse the response/);
  });

  it("keeps caller tools beside the submit tool", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(completion('{"topic":"seo"}'));
    await generateText({
      model: customModel("claude-sonnet-5-5"),
      output: Output.object({ schema: topicSchema }),
      tools: {
        search_competitors: tool({
          description: "Search",
          inputSchema: z.object({ q: z.string() }),
          execute: async () => "unused",
        }),
      },
      prompt: "hi",
      maxRetries: 0,
    });
    const body = requestSchema.parse(
      JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body)),
    );

    expect(body.response_format).toBeUndefined();
    expect(body.tool_choice).toBe("auto");
    expect(body.tools?.map((entry) => entry.function.name)).toEqual([
      "search_competitors",
      CUSTOM_CHAT_SUBMIT_TOOL,
    ]);
  });

  it("does not rewrite a normal chat reply", async () => {
    const fenced = "```ts\nconst x = 1;\n```";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(completion(fenced));
    const result = await generateText({
      model: customModel("claude-sonnet-5-5"),
      prompt: "show code",
      maxRetries: 0,
    });
    const body = requestSchema.parse(
      JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body)),
    );

    expect(body.response_format).toBeUndefined();
    expect(result.text).toBe(fenced);
  });
});

describe("OpenRouter structured output", () => {
  it("still sends json_schema when no custom base URL is set", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(completion('{"topic":"seo"}'));
    await generateText({
      model: buildChatAgentModel({ apiKey: "or-key" }, "gpt-4o-mini", "low"),
      output: Output.object({ schema: topicSchema }),
      prompt: "hi",
      maxRetries: 0,
    });
    const body = requestSchema.parse(
      JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body)),
    );

    expect(fetchUrl(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
    expect(body.response_format?.type).toBe("json_schema");
    expect(body.response_format?.json_schema?.strict).toBe(true);
  });
});
