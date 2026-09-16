# Seed research — dimensional / volumetric weight

Cluster: **priority 1, UPS dimensional weight**. One carrier, one tool. English (United States) first. Not a multi-carrier collection. Live brand: **dimpounds.com**. CBM lives on **freightcbm.com**, not this site.

Data from OpenSEO MCP on 2026-09-15. Project `653043b6-02b7-4a1a-b79e-1c1f27695755`, market **2840 / en**. Tools: `get_keyword_metrics` (volume, KD, CPC, intent) and `get_serp_results` (Google organic live/advanced, depth 20). Metrics that DataForSEO Labs did not return are **unknown**, not estimated.

`get_serp_results` text tables omit item `type`. Empty rows (no domain / title / URL) are SERP features. A **rank-1 empty row** matches DataForSEO’s `ai_overview` parent object (no URL). Mid-page empty rows are typically People Also Ask or related searches, not counted as AI Overview here.

## US English seeds

| Keyword | Intent | Volume | KD | CPC | Tool SERP? | AI Overview at #1 | Priority |
| ------- | ------ | -----: | -: | --: | ---------- | ----------------- | -------- |
| UPS dimensional weight calculator | informational | 880 | 21 | 4.58 | Yes — independent calculators plus UPS.com | Likely yes (empty rank 1) | **Build now** |
| FedEx dimensional weight calculator | informational | 1300 | 36 | 3.75 | Yes — FedEx official calculator at #1 | No (URL at rank 1) | Later page |
| DHL volumetric weight calculator | informational | 140 | 14 | 27.39 | Yes — DHL volume calculator at #1 | No (URL at rank 1) | Later page |
| CBM calculator shipping | informational | unknown | unknown | unknown | Yes — cbmcalculator.com at #1 | No (URL at rank 1) | Later; different formula |
| chargeable weight calculator air freight | informational | 170 | 0 | 4.83 | Mixed — several calculators plus how-tos | Likely yes (empty rank 1) | Later; air ÷5000/6000 |

Close variants (same US market, not extra pages):

| Keyword | Volume | KD | Notes |
| ------- | -----: | -: | ----- |
| dimensional weight calculator ups | 880 | 21 | Same Labs row as the UPS seed (word-order variant) |
| ups dim weight calculator | 110 | 20 | Same intent, smaller |
| ups dim calculator | 20 | 21 | Same intent, tiny |
| dimensional weight calculator | 1600 | 36 | Generic multi-carrier SERP. Do not retarget this UPS page at it. |
| cbm calculator | 4400 | 12 | Closest Labs match to the CBM seed |
| cbm calculator for shipping | 40 | 21 | Exact-ish CBM shipping phrase |
| cubic meter calculator shipping | 10 | 53 | Ignore |

The exact seed `CBM calculator shipping` returned **no Labs row**.

## Google SERP notes (US desktop)

### 1. `UPS dimensional weight calculator` — this page

Organic mix is a **tool SERP**, not an encyclopedia one-shot:

- Tool pages: UPS Chargeable & Volumetric Weight Calculator; omnicalculator.com; calcurates.com; shipmonk.com; ctcf-inc.com; packwire.com
- Brand / guide: UPS dimensions-and-weight support; UPS glossary; Shopify / Practical Ecommerce explainers; YouTube

UPS.com occupies several slots. Independent DIM calculators still rank. First page stays UPS Daily **139** / Retail **166** only.

### 2. `FedEx dimensional weight calculator`

Rank 1 is FedEx’s own calculator (`page.message.fedex.com/weight_calculator`). Then FedEx explainers, Omni Calculator, Calcurates, ShipMonk. Higher volume than UPS, higher KD, different divisor. Not this site.

### 3. `DHL volumetric weight calculator`

Rank 1 is DHL Aviation Cargo Volume Calculator. Remaining page is DHL help articles plus independents (parceltoolkit, fulfyld, dutyglobal). Metric wording (`volumetric`, usually cm/kg ÷5000). Not this site.

### 4. `CBM calculator shipping`

Rank 1 is cbmcalculator.com. Omni Calculator, Cargoespi, IncoDocs, Freightos, Shiprocket also rank. This is cubic meters for ocean/air, not UPS in³/lb.

### 5. `chargeable weight calculator air freight`

Likely AI Overview at #1. Organic: KK Global, UPS freight calculator, OEC Group, chargeableweight.com, Pegasus, DHL/Maersk explainers. Billable = max(actual, volumetric) with air divisors. Not this site.

## Language order

Checked the UPS English seed plus native calculator phrases. Missing Labs rows are unknown, not zero.

| Market | Phrase | Volume | KD |
| ------ | ------ | -----: | -: |
| Spain / es | calculadora peso volumetrico | 210 | 0 |
| Brazil / pt | calculadora peso cubado | 140 | 0 |
| Brazil / pt | UPS dimensional weight calculator | 10 | unknown |
| Brazil / pt | calculadora peso volumetrico | 20 | unknown |
| Mexico / es | calculadora ups | 50 | 57 |
| Indonesia / id | volumetric weight calculator | 30 | 61 |

1. **English, United States** — this site. UPS Daily/Retail is a US inches/pounds rule.
2. **Do not translate this page yet.** ES `peso volumétrico` and PT-BR `peso cubado` have some volume, but they are generic volumetric/CBM intent, not UPS 139/166. ID demand on these phrases is small and hard.
3. Revisit ES / PT-BR / ID only after Search Console shows US clicks, and only with a matching formula on a new URL.

## Browser check (2026-09-15)

Local `python3 -m http.server 4177`. Defaults 16 × 12 × 12 in / 10 lb:

- Daily 139 → billable **17 lb**
- Retail 166 → billable **14 lb**

Playwright (desktop + 390px) and a headed pass both matched. Unit tests 6/6.

## Build decision

Ship one English (US) UPS Daily/Retail calculator. No FedEx, DHL, CBM, unit converters, or language packs on this URL.
