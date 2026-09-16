# Raceway Fill — NEC conduit fill calculator

English (US) electrician site for **racewayfill.com**. THHN fill, voltage drop, and drop-limited wire size. Deploy this folder as its own Cloudflare Worker (Static Assets).

```bash
cd sites/conduit-fill-calculator
node --test
python3 -m http.server 4178
npx wrangler deploy --dry-run
# after racewayfill.com is in the Cloudflare account, uncomment routes in wrangler.jsonc
```

| Page | URL |
| --- | --- |
| Conduit fill | https://racewayfill.com/ |
| Voltage drop | https://racewayfill.com/voltage-drop.html |
| Wire size | https://racewayfill.com/wire-size.html |

Fill uses NEC Chapter 9 Tables 1, 4, and 5. Not the codebook.
