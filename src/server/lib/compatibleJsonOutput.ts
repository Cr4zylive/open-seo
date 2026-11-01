/**
 * Pull a JSON object or array out of proxy text. The stock fence stripper
 * only unwraps a fence that is the entire reply. Proxies also prepend a
 * sentence or close with one. Returns the longest JSON value that parses,
 * or the original text when there is nothing to extract.
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
