# Freight CBM — CBM calculator for shipping

English (US) cubic-meter tool for **freightcbm.com**. Own Cloudflare Worker (Static Assets). Not the UPS inches calculator.

```bash
cd sites/cbm-calculator
node --test
python3 -m http.server 4180
npx wrangler deploy --dry-run
# after freightcbm.com is in the Cloudflare account, uncomment routes in wrangler.jsonc
```
