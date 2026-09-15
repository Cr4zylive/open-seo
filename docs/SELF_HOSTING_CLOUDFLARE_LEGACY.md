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

That command applies D1 migrations, builds both bundles, deploys `open-seo-audit` first with `wrangler deploy`, then deploys `open-seo` the same way. Workers Builds also sets `WRANGLER_CI_OVERRIDE_NAME=open-seo` on the job; the deploy script unsets that for the audit upload so its Durable Object migrations are not applied to `open-seo`. After this dashboard change, later OpenSEO releases that add Workers stay on `pnpm run deploy` in `package.json` — you should not need to touch the dashboard again for this.

The Git-connected API token must be allowed to **create** `open-seo-audit`, not only edit `open-seo`. Account-level Workers Scripts Edit is enough; a token scoped to the `open-seo` script alone is not.

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

## TEAM_DOMAIN and POLICY_AUD

These two Worker variables are how OpenSEO checks Cloudflare Access login. They are **not** created by pasting anything into `.env.selfhost` on a Git / Wrangler install. Set them on the `open-seo` Worker: **Settings → Variables and Secrets**. `wrangler.jsonc` has `keep_vars: true`, so later `pnpm run deploy` keeps them.

**TEAM_DOMAIN** is your Zero Trust team URL, including `https://`. Example: `https://your-team.cloudflareaccess.com`. Find it in [Zero Trust](https://one.dash.cloudflare.com) → **Settings → Custom Pages** (the team domain), or copy the `iss` value from an Access JWT.

**POLICY_AUD** is the Application Audience (AUD) tag of the Access application that protects this Worker's hostname — a long hex string, unique per application. It is not an API token and not the Access policy name.

1. Open [Zero Trust](https://one.dash.cloudflare.com) → **Access controls → Applications**.
2. Open the application whose domain is your OpenSEO Worker (`*.workers.dev` or your custom domain).
3. **Configure → Additional settings**.
4. Copy **Application Audience (AUD) Tag** into `POLICY_AUD`.

If the Worker has no Access application in front of it, create one for that hostname first (self-hosted email login is fine), then copy the AUD. [Cloudflare's JWT docs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/#get-your-aud-tag) show the same screen.

Do **not** follow the current [Alchemy self-host guide](./SELF_HOSTING_CLOUDFLARE.md) to “fix” a missing `POLICY_AUD`. `pnpm deploy:selfhost` provisions a **new** D1, KV, and R2. This install's data stays in the D1 bound in `wrangler.jsonc` (`database_id` `a3103d08-79bf-4bd1-bec4-3ab2c9aa78c7` on this fork).

## Troubleshooting

**Login fails or OpenSEO doesn't load.** Re-check, on your Worker under `Settings`:

- `Domains & Routes`: `Cloudflare Access` is enabled for the `workers.dev` route.
- `Variables & Secrets`: `TEAM_DOMAIN` (for example `https://your-team.cloudflareaccess.com`), `POLICY_AUD` (the Access application audience tag), and `DATAFORSEO_API_KEY` are set. The `open-seo-audit` worker needs `DATAFORSEO_API_KEY` too.
- Manual Wrangler deployments: the binding IDs in `wrangler.jsonc` match your resources.

`https://<your-worker-hostname>/api/health` reports runtime configuration checks and database status. For server errors, open the Worker `Logs` or run `pnpm exec wrangler tail`. Site audits run in `open-seo-audit`: `pnpm exec wrangler tail open-seo-audit`.

**Deploy fails with API 10143 / `AUDIT_ENGINE` / `open-seo-audit` was not found.** Cloudflare Git is still running `npx wrangler deploy` (or `versions upload`) for only the app Worker. Follow [Updating (Cloudflare Git / Workers Builds)](#updating-cloudflare-git--workers-builds) above.

**Deploy fails with API 10211 / Durable Object migration / `/workers/scripts/open-seo/versions`.** The build used versioned upload (`wrangler versions upload`), which cannot apply Durable Object migrations. 0.1.8 must go out as `wrangler deploy`. Set **both** Deploy command and Non-production branch deploy command to `pnpm run deploy`, then retry. After those migrations are on the account, later uploads without new Durable Object tags can use versioned deploys again.

**Deploy fails with API 10074 / `new-sqlite-class` / `AuditScratchpad` already depended on.** Workers Builds rewrites every `wrangler deploy` in the job to the dashboard-connected Worker (`open-seo`) via `WRANGLER_CI_OVERRIDE_NAME`. The audit Worker's v1 `new_sqlite_classes: ["AuditScratchpad"]` then hits `open-seo`, which already created that class in v3. Current `pnpm run deploy` unsets that override for the `open-seo-audit` upload — retry the build; no dashboard change is required. The failed upload does not move the migration tag, so v4/v5 on `open-seo` still apply on the next successful deploy.

**Projects or keywords look empty after login.** Two different causes, both recoverable:

1. **v0.1.8 shared workspace.** Older installs gave each Access user their own workspace. The app now opens a shared workspace, which starts empty. If the dashboard shows a yellow banner, click **迁移工作区** — that folds the old per-user projects into the shared workspace. This is not a database wipe.
2. **New D1 from Alchemy.** If you ran `pnpm deploy:selfhost`, you are on a new empty database. The old D1 is still in the account (Workers → D1, database `open-seo`, id `a3103d08-79bf-4bd1-bec4-3ab2c9aa78c7`). Point the `open-seo` Worker `DB` binding back at that database; do not `alchemy destroy` the selfhost stage until you have confirmed which D1 holds the rows.

Onboarding SAM chats stored in `OnboardingChatAgent` were deleted on purpose in the 0.1.8 Durable Object migration. Project data, keywords, and audits live in D1, not in that class.

**Migrating to the current flow** is not supported yet — the new deploy provisions fresh resources, so your data would not move. Keep using this page.

## Everything else

MCP setup and telemetry work the same as current deployments — see [Operations](./SELF_HOSTING_CLOUDFLARE_OPERATIONS.md).
