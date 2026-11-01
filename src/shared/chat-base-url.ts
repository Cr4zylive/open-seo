// CHAT_BASE_URL is the name self-hosters set. OPENROUTER_BASE_URL is the
// alias from the original request, so either knob points SAM at the same
// OpenAI-compatible endpoint. An empty or whitespace value is unset.

export function selectChatBaseUrl(
  chatBaseUrl: string | undefined,
  openRouterBaseUrl: string | undefined,
): string | undefined {
  const primary = chatBaseUrl?.trim();
  if (primary) return primary;
  const alias = openRouterBaseUrl?.trim();
  return alias || undefined;
}
