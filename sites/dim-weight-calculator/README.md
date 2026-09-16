# Dim Pounds — UPS dimensional weight calculator

English (US) site for **dimpounds.com**. Carton inches + scale pounds → UPS billable weight. Not part of the OpenSEO app. Deploy this folder as its own Cloudflare Worker (Static Assets).

```bash
cd sites/dim-weight-calculator
node --test
python3 -m http.server 4177
# open http://127.0.0.1:4177/
npx wrangler deploy --dry-run
# after dimpounds.com is in the Cloudflare account, uncomment routes in wrangler.jsonc
# npx wrangler deploy
```

Do not attach this folder to the OpenSEO Worker.

Formula last checked against [UPS Shipping Dimensions and Weight](https://www.ups.com/us/en/support/shipping-support/shipping-dimensions-weight): nearest inch, Daily divisor **139**, Retail divisor **166**, fractional DIM weight rounds up, billable = max(actual, DIM).

See [RESEARCH.md](./RESEARCH.md) for the cluster choice, the five seed keywords, and when to add ES / PT-BR / ID.

AdSense: add the ad unit only after dimpounds.com is approved. Do not ship ads on a parked or thin host.
