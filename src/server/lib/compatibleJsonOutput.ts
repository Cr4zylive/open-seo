import type { LanguageModelV3 } from "@openrouter/ai-sdk-provider";
import {
  extractJsonMiddleware,
  wrapLanguageModel,
  type LanguageModelMiddleware,
} from "ai";

/**
 * Custom OpenAI-compatible endpoints (OOAPI and other proxies) receive
 * `Output.object` as
 * `response_format: { type: "json_schema", json_schema: { strict: true } }`.
 * Those proxies often answer with prose or a markdown fence, and the AI SDK
 * then throws `No object generated: could not parse the response`.
 *
 * This wrapper is only for that custom base URL path. It asks for
 * `json_object` instead, then extracts JSON from the reply. Zod validation
 * in `Output.object` still runs on the extracted text. Ordinary chat turns
 * are not rewritten.
 */
export function wrapCompatibleStructuredOutput(
  model: LanguageModelV3,
): LanguageModelV3 {
  return wrapLanguageModel({
    model,
    middleware: [downgradeJsonSchemaMiddleware, jsonTextExtractMiddleware],
  });
}

const downgradeJsonSchemaMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ params }) => {
    const format = params.responseFormat;
    // `{ type: "json" }` without a schema is what @openrouter/ai-sdk-provider
    // sends as `response_format: { type: "json_object" }`. A schema becomes
    // `json_schema` with `strict: true`.
    if (format?.type !== "json" || format.schema == null) return params;
    return { ...params, responseFormat: { type: "json" } };
  },
};

const extractJson = extractJsonMiddleware({ transform: extractProxyJsonText });
const extractJsonGenerate = extractJson.wrapGenerate;
const extractJsonStream = extractJson.wrapStream;
if (!extractJsonGenerate || !extractJsonStream) {
  throw new Error("extractJsonMiddleware must wrap generate and stream");
}

// Gate the extractor on JSON calls. It rewrites every text part, so leaving
// it on the shared chat model would turn a fenced code sample into raw text.
const jsonTextExtractMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  wrapGenerate: async (options) =>
    options.params.responseFormat?.type === "json"
      ? extractJsonGenerate(options)
      : options.doGenerate(),
  wrapStream: async (options) =>
    options.params.responseFormat?.type === "json"
      ? extractJsonStream(options)
      : options.doStream(),
};

/**
 * The stock `extractJsonMiddleware` transform only strips a fence that wraps
 * the entire reply. Proxies also prepend a sentence or close with one.
 * Returns the longest JSON object or array that parses, or the original text
 * when there is nothing to extract.
 */
export function extractProxyJsonText(text: string): string {
  const trimmed = text.trim();
  if (isJson(trimmed)) return trimmed;

  const unfenced = unwrapFence(trimmed);
  if (unfenced !== trimmed && isJson(unfenced)) return unfenced;

  return longestJsonValue(unfenced) ?? text;
}

function unwrapFence(text: string): string {
  const match = /^```(?:json)?[ \t]*\r?\n?([\s\S]*?)\r?\n?```[ \t]*$/i.exec(
    text,
  );
  const inner = match?.[1]?.trim();
  return inner && inner.length > 0 ? inner : text;
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function longestJsonValue(text: string): string | undefined {
  let best: string | undefined;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char !== "{" && char !== "[") continue;
    const slice = balancedSlice(text, index);
    if (!slice || !isJson(slice)) continue;
    if (!best || slice.length > best.length) best = slice;
  }
  return best;
}

function balancedSlice(text: string, start: number): string | undefined {
  const open = text[start];
  if (open !== "{" && open !== "[") return undefined;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (char == null) break;
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return undefined;
}
