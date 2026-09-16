# Overseas tool sites

See [PLAN.md](./PLAN.md). Each folder is a separate Cloudflare Worker (Static Assets) and must stay that way.

| Folder | Domain | Worker | Primary keyword | Local port |
| --- | --- | --- | --- | ---: |
| `dim-weight-calculator` | [dimpounds.com](https://dimpounds.com/) | `dimpounds` | UPS dimensional weight calculator | 4177 |
| `conduit-fill-calculator` | [racewayfill.com](https://racewayfill.com/) | `racewayfill` | conduit fill calculator | 4178 |
| `stair-calculator` | [stairrise.com](https://stairrise.com/) | `stairrise` | stair calculator | 4179 |
| `cbm-calculator` | [freightcbm.com](https://freightcbm.com/) | `freightcbm` | cbm calculator | 4180 |

Domains are chosen, not purchased. Keep `custom_domain` routes in each `wrangler.jsonc` commented until the name is in the Cloudflare account.
