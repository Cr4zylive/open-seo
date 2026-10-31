---
title: "Self-Hosting OpenSEO"
description: "Run OpenSEO yourself with Docker or Cloudflare, bring your own DataForSEO API key, and pay only for what you use."
---

OpenSEO is free and open source. Self-hosting means the app costs $0. You bring your own DataForSEO API key and pay DataForSEO directly for API usage.

There are two self-hosting paths:

- **Simple: [Docker](/docs/self-hosting/docker)**, recommended for personal use on your own machine. Easiest way to get started.
- **Advanced: [Cloudflare](/docs/self-hosting/cloudflare)**, for internet-facing self-hosting across multiple devices or with your team. A SaaS-like experience with automatic database backups, and it works on Cloudflare's free plan. Slightly more setup if you're unfamiliar with Cloudflare.

## DataForSEO API key setup

OpenSEO uses [DataForSEO](https://dataforseo.com/?aff=255379) to fetch SEO data. DataForSEO is a paid third-party service unaffiliated with OpenSEO. You need an API key to connect OpenSEO to it.

1. Go to [DataForSEO API Access](https://app.dataforseo.com/api-access?aff=255379).
2. Click "Send by email" to get your credentials.
3. Copy the longer credentials labelled "Base64" credentials.
4. Set this as `DATAFORSEO_API_KEY` in your environment:
   - Docker: `.env`
   - Cloudflare: as a Worker secret in the dashboard
   - Local development: `.env.local`

New DataForSEO accounts include $1 of free credit to test with, and the minimum top-up is $50. See [pricing](/pricing) for cost estimates. Self-hosted costs run slightly lower, since the hosted service adds a 28% fee on DataForSEO requests.

## Optional features

### Google Search Console

Search Console is optional and works in self-hosted deployments using your own Google OAuth client. It takes about 10 minutes of one-time setup. See the [Google Search Console guide on GitHub](https://github.com/every-app/open-seo/blob/main/docs/SELF_HOSTING_GOOGLE_SEARCH_CONSOLE.md).

### AI features (SAM)

SAM, the in-app SEO agent, is optional. By default it calls [OpenRouter](https://openrouter.ai/settings/keys). Set `OPENROUTER_API_KEY` to a key from that page.

To use another OpenAI-compatible chat API, set `CHAT_BASE_URL` to that API's base URL, including `/v1`. `OPENROUTER_API_KEY` is still the Bearer token: for a custom endpoint it is that provider's API key, not an OpenRouter key. `OPENROUTER_MODEL` is the model id the gateway expects. `OPENROUTER_BASE_URL` is an alias for `CHAT_BASE_URL`. Leave both base URLs unset to keep OpenRouter.

```bash
CHAT_BASE_URL=https://api.ooapi.cc/v1
OPENROUTER_API_KEY=your-provider-api-key
OPENROUTER_MODEL=the-model-id-that-gateway-expects
```

Docker reads these from `.env`. Cloudflare self-hosting reads them from `.env.selfhost` (redeploy after changing them). The model has to support OpenAI-style tool calls, because SAM uses tools. A custom endpoint does not return OpenRouter's usage cost, so that spend is recorded as 0. You pay the chat provider directly.
