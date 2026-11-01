import { describe, expect, it } from "vitest";
import {
  CUSTOM_CHAT_SUBMIT_TOOL,
  materializeStructuredOutput,
  softenCustomEndpointParams,
  stripMarkdownJsonFence,
} from "./custom-chat-endpoint-middleware";

describe("softenCustomEndpointParams", () => {
  it("strips temperature and rewrites json schema output into an auto submit tool", () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    } as const;
    const next = softenCustomEndpointParams({
      prompt: [{ role: "system", content: "Return a topic." }],
      temperature: 0,
      responseFormat: { type: "json", schema, name: "out" },
      toolChoice: { type: "required" },
    });

    expect(next.temperature).toBeUndefined();
    expect(next.responseFormat).toEqual({ type: "text" });
    expect(next.toolChoice).toEqual({ type: "auto" });
    expect(next.tools).toEqual([
      expect.objectContaining({
        type: "function",
        name: CUSTOM_CHAT_SUBMIT_TOOL,
        inputSchema: schema,
      }),
    ]);
    expect(next.prompt[0]).toMatchObject({
      role: "system",
      content: expect.stringContaining(CUSTOM_CHAT_SUBMIT_TOOL),
    });
  });

  it("softens forced tool_choice when tools are already present", () => {
    const next = softenCustomEndpointParams({
      prompt: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      tools: [
        {
          type: "function",
          name: "search",
          inputSchema: { type: "object", properties: {} },
        },
      ],
      toolChoice: { type: "tool", toolName: "search" },
    });
    expect(next.toolChoice).toEqual({ type: "auto" });
    expect(next.tools).toHaveLength(1);
  });
});

describe("materializeStructuredOutput", () => {
  it("turns the submit tool call into text for Output.object", () => {
    const content = materializeStructuredOutput([
      { type: "text", text: "Working…" },
      {
        type: "tool-call",
        toolCallId: "1",
        toolName: CUSTOM_CHAT_SUBMIT_TOOL,
        input: '{"name":"SEO tools","prompts":["a","b","c","d","e"]}',
      },
    ]);
    expect(content).toEqual([
      {
        type: "text",
        text: '{"name":"SEO tools","prompts":["a","b","c","d","e"]}',
      },
    ]);
  });

  it("strips markdown fences when the model returned text instead", () => {
    expect(
      materializeStructuredOutput([
        { type: "text", text: '```json\n{"ok":true}\n```' },
      ]),
    ).toEqual([{ type: "text", text: '{"ok":true}' }]);
  });

  it("stringifies object tool input for Output.object text", () => {
    const content = materializeStructuredOutput([
      {
        type: "tool-call",
        toolCallId: "1",
        toolName: CUSTOM_CHAT_SUBMIT_TOOL,
        // Some gateways hand back parsed objects; normalize to a JSON string.
        input: { name: "SEO tools", prompts: ["a", "b"] },
      } as never,
    ]);
    expect(content).toEqual([
      {
        type: "text",
        text: JSON.stringify({ name: "SEO tools", prompts: ["a", "b"] }),
      },
    ]);
  });
});

describe("stripMarkdownJsonFence", () => {
  it("leaves bare JSON alone", () => {
    expect(stripMarkdownJsonFence('{"ok":true}')).toBe('{"ok":true}');
  });
});
