# Stair Rise — stair calculator

English (US) straight-run rise/run tool for **stairrise.com**. Own Cloudflare Worker (Static Assets).

```bash
cd sites/stair-calculator
node --test
python3 -m http.server 4179
npx wrangler deploy --dry-run
# after stairrise.com is in the Cloudflare account, uncomment routes in wrangler.jsonc
```
