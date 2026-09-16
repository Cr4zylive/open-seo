# CBM calculator for shipping

English (US) cubic-meter tool. Own Cloudflare Worker (Static Assets). Not the UPS inches calculator.

```bash
cd sites/cbm-calculator
node --test
python3 -m http.server 4180
npx wrangler deploy --dry-run
```
