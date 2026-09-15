// Deploy the site-audit aux worker before the app worker.
// Cloudflare rejects the app upload (API 10143) if AUDIT_ENGINE / the
// cross-script site-audit workflow points at a Worker that does not exist.
//
// Used by `pnpm run deploy`. Cloudflare Workers Builds must set BOTH the
// production Deploy command and the non-production branch command to
// `pnpm run deploy`. The default `npx wrangler versions upload` cannot
// apply Durable Object migrations (API 10211) and does not create
// open-seo-audit (API 10143).
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const AUDIT_WORKER = "open-seo-audit";
const APP_WORKER = "open-seo";

const auditConfig = existsSync("dist/open_seo_audit/wrangler.json")
  ? "dist/open_seo_audit/wrangler.json"
  : "wrangler.audit.jsonc";

// Workers Builds sets WRANGLER_CI_OVERRIDE_NAME to the dashboard-connected
// Worker (`open-seo`) and WRANGLER_CI_MATCH_TAG to that script's id. Wrangler
// then rewrites every `wrangler deploy` in the job to that name — `--name`
// and the config `name` field lose. The audit Worker's v1
// `new_sqlite_classes: ["AuditScratchpad"]` would land on `open-seo`, which
// already created that class in v3, and Cloudflare returns API 10074.
function wranglerEnvForWorker(env, workerName) {
  const next = { ...env };
  if (
    next.WRANGLER_CI_OVERRIDE_NAME &&
    next.WRANGLER_CI_OVERRIDE_NAME !== workerName
  ) {
    delete next.WRANGLER_CI_OVERRIDE_NAME;
    delete next.WRANGLER_CI_MATCH_TAG;
  }
  return next;
}

function readWorkerName(configPath) {
  const raw = readFileSync(configPath, "utf8");
  const quoted = raw.match(/"name"\s*:\s*"([^"]+)"/);
  return quoted?.[1] ?? null;
}

function run(args, env) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], {
    stdio: "inherit",
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function deployWorkers() {
  const auditName = readWorkerName(auditConfig);
  if (auditName !== AUDIT_WORKER) {
    console.error(
      `Expected ${auditConfig} to set name "${AUDIT_WORKER}", got ${JSON.stringify(auditName)}.`,
    );
    process.exit(1);
  }

  if (
    process.env.WRANGLER_CI_OVERRIDE_NAME &&
    process.env.WRANGLER_CI_OVERRIDE_NAME !== AUDIT_WORKER
  ) {
    console.log(
      `\nWorkers Builds set WRANGLER_CI_OVERRIDE_NAME=${process.env.WRANGLER_CI_OVERRIDE_NAME}; unsetting it (and WRANGLER_CI_MATCH_TAG) for ${AUDIT_WORKER} so AuditScratchpad's new_sqlite_classes migration is not applied to ${APP_WORKER} (API 10074).\n`,
    );
  }

  console.log(
    `\nDeploying ${AUDIT_WORKER} first (${auditConfig}) so AUDIT_ENGINE has a target.\n`,
  );
  run(
    ["deploy", "-c", auditConfig, "--name", AUDIT_WORKER],
    wranglerEnvForWorker(process.env, AUDIT_WORKER),
  );
  console.log(`\nDeploying ${APP_WORKER}.\n`);
  run(
    ["deploy", "--name", APP_WORKER],
    wranglerEnvForWorker(process.env, APP_WORKER),
  );
}

deployWorkers();
