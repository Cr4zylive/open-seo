# NEC conduit fill calculator

English (US) electrician tool: THHN fill, voltage drop, and drop-limited wire size. Deploy this folder as its own Cloudflare Worker (Static Assets).

```bash
cd sites/conduit-fill-calculator
node --test
python3 -m http.server 4178
npx wrangler deploy --dry-run
```

Fill uses NEC Chapter 9 Tables 1, 4, and 5. Not the codebook.
