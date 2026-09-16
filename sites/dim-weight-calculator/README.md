# UPS dimensional weight calculator

Standalone English (US) tool: carton inches + scale pounds → UPS billable weight. Not part of the OpenSEO app. Deploy this folder as a static site (Cloudflare Pages, Netlify, or any static host).

```bash
cd sites/dim-weight-calculator
node --test
python3 -m http.server 4177
# open http://127.0.0.1:4177/
npx wrangler deploy --dry-run
# after a custom domain: npx wrangler deploy
```

Deploy as its own Cloudflare Worker (Static Assets). Do not attach this folder to the OpenSEO Worker.

Formula last checked against [UPS Shipping Dimensions and Weight](https://www.ups.com/us/en/support/shipping-support/shipping-dimensions-weight): nearest inch, Daily divisor **139**, Retail divisor **166**, fractional DIM weight rounds up, billable = max(actual, DIM).

See [RESEARCH.md](./RESEARCH.md) for the cluster choice, the five seed keywords, and when to add ES / PT-BR / ID.

AdSense: add the ad unit only after the domain is approved. Do not ship ads on a parked or thin host.
