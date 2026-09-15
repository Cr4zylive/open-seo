# Cloudflare Self-Hosting: Legacy Deployments

Maintenance for installs created with the retired **Deploy to Cloudflare button** or the **manual Wrangler flow**. These deployments keep working — nothing changes for you. New deployments should use the [current guide](./SELF_HOSTING_CLOUDFLARE.md).

## Updating (Deploy-button repos)

Your repo was created by the deploy button and `wrangler.jsonc` holds your resource IDs; keep them while pulling the newest code.

One-time setup:

```bash
git remote add upstream https://github.com/every-app/open-seo.git
```

Update steps:

```bash
git fetch upstream
cp wrangler.jsonc wrangler.local.backup.jsonc
git checkout main
git reset --hard upstream/main
cp wrangler.local.backup.jsonc wrangler.jsonc
git add wrangler.jsonc
git commit -m "restore Cloudflare settings" || true
git push --force-with-lease origin main
```

## Updating (manual Wrangler deployments)

```bash
git pull
pnpm install
pnpm run deploy
```

`pnpm run deploy` also deploys a second worker, `open-seo-audit`, which runs site audits. Copy your `DB`, `KV`, and `R2` bindings from `wrangler.jsonc` into `wrangler.audit.jsonc` (it needs no `OAUTH_KV`) — the deploy fails on ids that don't exist in your account. Then set its DataForSEO key once, or every Lighthouse check in an audit fails:

```bash
pnpm exec wrangler secret put DATAFORSEO_API_KEY --name open-seo-audit
```

## Updating (Cloudflare Git / Workers Builds)

v0.1.8 split site audits into a second Worker named `open-seo-audit`. The app Worker binds to it as `AUDIT_ENGINE`. Cloudflare's Git integration still defaults to `npx wrangler deploy`, which only uploads `open-seo`, so the upload fails with **API 10143** (`Service binding 'AUDIT_ENGINE' references Worker 'open-seo-audit' which was not found`). Workers Builds also ignores Wrangler's `build.command`, so this has to be set in the dashboard.

One-time, on the `open-seo` Worker: **Settings → Build → Builds configuration**:

1. Keep your existing **Build command** (for example `pnpm run build`).
2. Set **Deploy command** to:

   ```bash
   pnpm run deploy
   ```

   Do not leave this as `npx wrangler versions upload` and do not put `pnpm run deploy` only in the Build command. v0.1.8 includes Durable Object migrations (delete `AuditScratchpad` and `OnboardingChatAgent` on `open-seo`; create `AuditScratchpad` on `open-seo-audit`). Cloudflare rejects those on the versions API with **10211**.

3. Set **Non-production branch deploy command** to the same `pnpm run deploy`. This is the command Cloudflare Git runs for every branch that is not the production branch (including `_tmp_*` feature branches). Its default is `npx wrangler versions upload`, which fails with 10211 until the 0.1.8 Durable Object migrations have been applied by a real `wrangler deploy`.

That command applies D1 migrations, builds both bundles, deploys `open-seo-audit` first with `wrangler deploy`, then deploys `open-seo` the same way. After this dashboard change, later OpenSEO releases that add Workers stay on `pnpm run deploy` in `package.json` — you should not need to touch the dashboard again for this.

Then, once, copy the DataForSEO secret onto the new Worker (same value as `open-seo`):

```bash
pnpm exec wrangler secret put DATAFORSEO_API_KEY --name open-seo-audit
```

Or in the dashboard: Workers → `open-seo-audit` → Settings → Variables and Secrets.

Redeploy after those two steps. Leave `wrangler.jsonc` / `wrangler.audit.jsonc` resource IDs as this account's KV/D1/R2 — do not replace them with upstream IDs.

## Giving teammates access

1. Open Cloudflare Zero Trust.
2. Go to Access -> Applications.
3. Open your OpenSEO application.
4. Edit the `Allow` policy.
5. Add teammate emails (or your company email domain / group).
6. Save.

Screenshots: [edit the Access policy](https://github.com/user-attachments/assets/c7bbc7b4-a18e-4ae4-9fe5-3b33c72048a7), [add teammate emails](https://github.com/user-attachments/assets/fa4ecaf2-31f7-4a64-9001-210cf729747b).

## Optional: R2 lifecycle rule

DataForSEO API responses are cached in R2 under the `dataforseo-cache/` prefix. Recommended so expired cache objects don't accumulate:

```bash
pnpm exec wrangler r2 bucket lifecycle add open-seo dataforseo-cache-expiry dataforseo-cache/ --expire-days 7
```

Replace `open-seo` with your bucket name if you changed it.

## Troubleshooting

**Login fails or OpenSEO doesn't load.** Re-check, on your Worker under `Settings`:

- `Domains & Routes`: `Cloudflare Access` is enabled for the `workers.dev` route.
- `Variables & Secrets`: `TEAM_DOMAIN` (for example `https://your-team.cloudflareaccess.com`), `POLICY_AUD` (the Access application audience tag), and `DATAFORSEO_API_KEY` are set. The `open-seo-audit` worker needs `DATAFORSEO_API_KEY` too.
- Manual Wrangler deployments: the binding IDs in `wrangler.jsonc` match your resources.

`https://<your-worker-hostname>/api/health` reports runtime configuration checks and database status. For server errors, open the Worker `Logs` or run `pnpm exec wrangler tail`. Site audits run in `open-seo-audit`: `pnpm exec wrangler tail open-seo-audit`.

**Deploy fails with API 10143 / `AUDIT_ENGINE` / `open-seo-audit` was not found.** Cloudflare Git is still running `npx wrangler deploy` (or `versions upload`) for only the app Worker. Follow [Updating (Cloudflare Git / Workers Builds)](#updating-cloudflare-git--workers-builds) above.

**Deploy fails with API 10211 / Durable Object migration / `/workers/scripts/open-seo/versions`.** The build used versioned upload (`wrangler versions upload`), which cannot apply Durable Object migrations. 0.1.8 must go out as `wrangler deploy`. Set **both** Deploy command and Non-production branch deploy command to `pnpm run deploy`, then retry. After those migrations are on the account, later uploads without new Durable Object tags can use versioned deploys again.

**Migrating to the current flow** is not supported yet — the new deploy provisions fresh resources, so your data would not move. Keep using this page.

## Everything else

MCP setup and telemetry work the same as current deployments — see [Operations](./SELF_HOSTING_CLOUDFLARE_OPERATIONS.md).
