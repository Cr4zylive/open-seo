import type {
  LanguageModelV3,
  LanguageModelV3Prompt,
} from "@openrouter/ai-sdk-provider";
import type { LanguageModelMiddleware } from "ai";

// @openrouter/ai-sdk-provider re-exports LanguageModelV3 only. Call and
// content shapes are derived from that interface, same as chatAgent.ts.
type LanguageModelV3CallOptions = Parameters<LanguageModelV3["doGenerate"]>[0];
type GenerateResult = Awaited<ReturnType<LanguageModelV3["doGenerate"]>>;
type LanguageModelV3Content = GenerateResult["content"][number];
type LanguageModelV3ToolChoice = NonNullable<
  LanguageModelV3CallOptions["toolChoice"]
>;

/** Tool name mid-proxies call for structured Output.object results. */
export const CUSTOM_CHAT_SUBMIT_TOOL = "openseo_submit_structured_output";

const SUBMIT_INSTRUCTION = `When you are ready to return the final structured answer, call the ${CUSTOM_CHAT_SUBMIT_TOOL} tool with the complete object that matches its parameters. Do not wrap the arguments in markdown.`;

/**
 * OpenAI-compatible mid-proxies (e.g. OOAPI Claude groups) often reject
 * non-default temperature and forced tool_choice, and return markdown-fenced
 * JSON for response_format=json_schema — which breaks AI SDK Output.object
 * parsing. Rewrite json responseFormat into an auto tool_choice submit tool,
 * strip temperature, and surface the tool args as plain text for the SDK.
 */
export function customChatEndpointMiddleware(): LanguageModelMiddleware {
  return {
    specificationVersion: "v3",
    transformParams: async ({ params }) => softenCustomEndpointParams(params),
    wrapGenerate: async ({ doGenerate, params }) => {
      const result = await doGenerate();
      const hadSubmit = hasSubmitToolCall(result.content);
      // Only rewrite structured turns. A normal chat reply can be a fenced
      // code sample; stripping that fence would show the raw body instead.
      const structured = hadSubmit || requestsStructuredSubmit(params);
      return {
        ...result,
        content: structured
          ? materializeStructuredOutput(result.content)
          : result.content,
        // AI SDK 6 only runs Output.object parse when finishReason === "stop"
        // (compares the unified field after mapping). V3 finishReason is an
        // object { unified, raw }, not a bare string.
        finishReason: hadSubmit
          ? asStopFinishReason(result.finishReason)
          : result.finishReason,
      };
    },
  };
}

export function softenCustomEndpointParams(
  params: LanguageModelV3CallOptions,
): LanguageModelV3CallOptions {
  const next: LanguageModelV3CallOptions = { ...params };
  // Claude-compatible gateways reject explicit non-default temperature.
  delete next.temperature;

  const format = next.responseFormat;
  if (format?.type === "json" && format.schema) {
    const tools = [...(next.tools ?? [])];
    if (
      !tools.some(
        (tool) =>
          tool.type === "function" && tool.name === CUSTOM_CHAT_SUBMIT_TOOL,
      )
    ) {
      tools.push({
        type: "function",
        name: CUSTOM_CHAT_SUBMIT_TOOL,
        description:
          "Submit the final structured result. Call exactly once when the answer is complete.",
        inputSchema: format.schema,
      });
    }
    next.tools = tools;
    next.responseFormat = { type: "text" };
    next.toolChoice = softenToolChoice(next.toolChoice);
    next.prompt = withSubmitInstruction(next.prompt);
    return next;
  }

  if (next.tools?.length) {
    next.toolChoice = softenToolChoice(next.toolChoice);
  }
  return next;
}

export function materializeStructuredOutput(
  content: LanguageModelV3Content[],
): LanguageModelV3Content[] {
  const submit = content.find(
    (part): part is Extract<LanguageModelV3Content, { type: "tool-call" }> =>
      part.type === "tool-call" && part.toolName === CUSTOM_CHAT_SUBMIT_TOOL,
  );
  if (submit) {
    // Output.object parses the concatenated text parts. Keep only the JSON
    // payload so prose before the tool call does not break JSON.parse.
    const payload =
      typeof submit.input === "string"
        ? submit.input
        : JSON.stringify(submit.input);
    return [{ type: "text", text: payload }];
  }
  return content.map((part) =>
    part.type === "text"
      ? { ...part, text: stripMarkdownJsonFence(part.text) }
      : part,
  );
}

function asStopFinishReason(
  finishReason:
    | { unified: string; raw?: string | undefined }
    | string
    | undefined,
): { unified: "stop"; raw: string | undefined } {
  if (finishReason && typeof finishReason === "object") {
    return { unified: "stop", raw: finishReason.raw };
  }
  return {
    unified: "stop",
    raw: typeof finishReason === "string" ? finishReason : undefined,
  };
}

function hasSubmitToolCall(content: LanguageModelV3Content[]): boolean {
  return content.some(
    (part) =>
      part.type === "tool-call" && part.toolName === CUSTOM_CHAT_SUBMIT_TOOL,
  );
}

function requestsStructuredSubmit(params: LanguageModelV3CallOptions): boolean {
  return (
    params.tools?.some(
      (tool) =>
        tool.type === "function" && tool.name === CUSTOM_CHAT_SUBMIT_TOOL,
    ) ?? false
  );
}

function softenToolChoice(
  toolChoice: LanguageModelV3ToolChoice | undefined,
): LanguageModelV3ToolChoice {
  if (!toolChoice) return { type: "auto" };
  if (toolChoice.type === "required" || toolChoice.type === "tool") {
    return { type: "auto" };
  }
  return toolChoice;
}

function withSubmitInstruction(
  prompt: LanguageModelV3Prompt,
): LanguageModelV3Prompt {
  const first = prompt[0];
  if (first?.role === "system") {
    if (first.content.includes(CUSTOM_CHAT_SUBMIT_TOOL)) return prompt;
    return [
      { ...first, content: `${first.content}\n\n${SUBMIT_INSTRUCTION}` },
      ...prompt.slice(1),
    ];
  }
  return [{ role: "system", content: SUBMIT_INSTRUCTION }, ...prompt];
}

/** Unwrap ```json ... ``` (or bare ``` ... ```) so Output.object can parse. */
export function stripMarkdownJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/i.exec(trimmed);
  return fenced ? fenced[1].trim() : text;
}
