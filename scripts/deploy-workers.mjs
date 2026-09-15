// Deploy the site-audit aux worker before the app worker.
// Cloudflare rejects the app upload (API 10143) if AUDIT_ENGINE / the
// cross-script site-audit workflow points at a Worker that does not exist.
//
// Used by `pnpm run deploy`. Cloudflare Workers Builds must set its Deploy
// command to `pnpm run deploy` — the default `npx wrangler deploy` only
// uploads open-seo and will keep failing after v0.1.8.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const auditConfig = existsSync("dist/open_seo_audit/wrangler.json")
  ? "dist/open_seo_audit/wrangler.json"
  : "wrangler.audit.jsonc";

function run(args) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `\nDeploying open-seo-audit first (${auditConfig}) so AUDIT_ENGINE has a target.\n`,
);
run(["deploy", "-c", auditConfig]);
console.log("\nDeploying open-seo.\n");
run(["deploy"]);
