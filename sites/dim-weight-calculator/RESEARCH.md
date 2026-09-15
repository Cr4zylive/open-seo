# Seed research — dimensional / volumetric weight

Cluster chosen: **priority 1, UPS dimensional weight** (not construction, not tax). One carrier, one tool. OpenSEO MCP could not be authenticated in this environment (`mcp_auth` returned no URL; `DATAFORSEO_API_KEY` unset). Volume and keyword difficulty are **unknown** — not estimated.

Google HTML SERPs were not available here (bot walls). Evidence below is Bing live HTML (2026-09-15) plus pages that loaded directly.

## Five seeds

1. `UPS dimensional weight calculator`
   - Intent: tool
   - Volume / KD: unknown
   - Bing organic: UPS.com brand destinations (shipping home, track, pickup). Independent calculators did not appear in the first Bing pack — treat Google as the market that matters, and expect the carrier homepage to compete.
   - AI Overview: not observed on Bing. Not confirmed on Google from this environment.

2. `FedEx dimensional weight calculator`
   - Left for a later page. Same cluster, different carrier. Not built.

3. `DHL volumetric weight calculator`
   - Left for a later page. Metric wording (`volumetric`) is the DHL/air-freight phrase.

4. `CBM calculator shipping`
   - Intent: tool (cubic meters for ocean/air, related but not UPS DIM)
   - Volume / KD: unknown
   - Bing organic (tool pages, not dictionaries):
     1. cbmcalculator.com — calculator
     2. comicbookmovie.com — off-intent
     3. thecalculatorsite.com cubic-meters calculator — calculator
     4. easycbm.com — off-intent education product
     5. freightos.com CBM resource — calculator/guide
     6. cbmcalculator.com explainer
     7. wikiHow “Calculate CBM”
     8. cogoport CBM explainer
   - Read: independent calculator sites already rank. Freightos is the authority competitor. This seed is winnable later; it is not the first page (different formula: CBM vs UPS in³/lb).

5. `chargeable weight calculator air freight`
   - Intent: tool (max(actual, volumetric) for air, usually ÷5000 or ÷6000 in cm/kg)
   - Volume / KD: unknown
   - Bing organic this run was polluted (cm-to-feet converters). Do not treat that SERP as reliable. Re-check on Google with OpenSEO `get_serp_results` before building.

## Direct tool-page evidence (not SERP rank)

These URLs returned calculator/guide documents, which is the SERP type the plan wants (not a one-shot encyclopedia answer):

- https://calcurates.com/dimensional-weight-calculator — multi-carrier DIM tool
- https://sizelabs.com/carrier-dim-policies — 2026 carrier divisor table
- https://www.speedcommerce.com/how-to-calculate-dimensional-weight-in-kg-and-lbs/ — 2026 formula guide
- https://www.ups.com/us/en/support/shipping-support/shipping-dimensions-weight — official UPS rule (Daily 139, Retail 166)

## Language order

1. **English, United States** — this site. UPS Daily/Retail is a US inches/pounds rule. AdSense RPM is highest on US/UK/AU/CA English.
2. **English, United Kingdom / Australia** — only after Search Console shows US clicks. UK/AU often search `volumetric weight`; that may need a DHL/air page, not a copy of this UPS inches tool.
3. **Spanish, Portuguese (Brazil), Indonesian** — same UPS or CBM formula, new URLs, after English has demand. Do not translate this page until then. Each language is its own SERP.

## Build decision

First page targets seed (1) only: UPS Daily 139 / Retail 166. No FedEx, DHL, CBM, or unit-converter pack.
