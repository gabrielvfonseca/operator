# Rename OpenClaw → Operator

## Goal

Rename the product from **OpenClaw / openclaw / @openclaw** to **Operator / operator / @operator** everywhere in this monorepo, including published npm package names, the `openclaw` CLI, `openclaw.json` config, `~/.openclaw` state dir, and `OPENCLAW_*` env vars. Canonical name is `operator` (CLI/binary/package), display title `Operator`. Git remotes stay as-is unless separately requested.

## Constraints (from repo AGENTS.md)

- Package names change internally (`@operator/*` → `@operator/*`, root `openclaw` → `operator`) so the workspace re-links correctly. **No npm publish step** — publishing is explicitly out of scope.
- Config break is compatibility-sensitive: must ship an `operator doctor --fix` migration (and `openclaw doctor` alias) that converts `openclaw.json`→`operator.json`, `~/.openclaw`→`~/.operator`, and `OPENCLAW_*`→`OPERATOR_*` in existing files. Runtime reads canonical `operator.*` only — NO silent fallback readers.
- Keep `openclaw doctor` and `openclaw` binary working as aliases (shim/alias) so existing docs/snippets don't hard-break, but the canonical command is `operator`.
- Naming rule: product/docs = `Operator`; CLI/package/path/config = `operator`.
- Never commit secrets; never edit `node_modules`.

## Scope facts (verified)

- 169 `@operator/*` packages (`grep -rl '"@operator/'` excluding node_modules).
- ~13,644 source files reference `openclaw` (src/packages/extensions/apps/ui/sdk/sdks/docs/scripts).
- Root `package.json`: `"name": "openclaw"`, `"bin": { "openclaw": "openclaw.mjs" }`, homepage/repo/bugs point to `github.com/openclaw/openclaw`.
- `openclaw.mjs` and `operator.mjs` already exist and are identical (792 lines) — `operator.mjs` is a pre-existing duplicate.
- `OPENCLAW_*` env vars appear ~9,494 times across code+tests (incl. `OPENCLAW_HOME`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_THEME`, etc.).
- `openclaw.json` string appears ~896 times (mostly test fixtures).

## Execution strategy

Mechanical, layered, each layer followed by `pnpm install` + targeted typecheck/lint so breakage is localizable.

### Layer 0 — Prep

1. Branch from `origin/main` (rebase-clean). Do NOT fetch/rebase upstream; only `origin` (gabrielvfonseca/operator).
2. Inventory: capture list of all `package.json` with `@operator/` deps and `name: openclaw` for the workspace map.

### Layer 1 — Package names & workspace (highest risk)

3. Root `package.json`: rename `"name"` → `operator`; `"bin"` → `{ "operator": "operator.mjs", "openclaw": "operator.mjs" }` (alias); update `homepage`/`repository`/`bugs` URLs to `github.com/gabrielvfonseca/operator` (or keep generic? → DECISION: point to `operator` repo).
4. Every `extensions/*/package.json`, `packages/*/package.json`, `apps/*/package.json`, SDK package.jsons: rename `"name": "@operator/x"` → `"@operator/x"`.
5. Replace all intra-repo dependency references `"@operator/..."` and `"openclaw": "workspace:*"` with `@operator/...` / `"operator": "workspace:*"`.
6. `pnpm-workspace.yaml`: update any catalog/scope references.
7. Run `pnpm install` to re-link workspace; fix resolution errors.

### Layer 2 — Config filename, state dir, env vars (needs doctor migration)

8. Add `operator doctor --fix` migration logic:
   - Rename `openclaw.json` → `operator.json` in config dir.
   - Move `~/.openclaw` → `~/.operator`.
   - Rewrite `OPENCLAW_*` → `OPERATOR_*` inside migrated config/env files.
   - `openclaw doctor` becomes an alias to `operator doctor` (thin shim).
9. Update canonical runtime constants: config filename `operator.json`, state dir `~/.operator`, env prefix `OPERATOR_`. Remove silent compat readers.
10. Keep `openclaw` binary alias (Layer 1 bin) so `openclaw doctor` still invokes the new doctor.

### Layer 3 — Source code identifiers & strings

11. Bulk-rename in code (excluding node_modules, dist, lockfiles): `openclaw` → `operator` for path/config/env literals. Be careful with:
    - `OPENCLAW_*` → `OPERATOR_*` (exact var names).
    - `openclaw.json` → `operator.json`; `.openclaw` → `.operator`.
    - import specifiers `@operator/...` → `@operator/...` (handled in Layer 1 but verify dynamic imports / `openclaw/plugin-sdk` barrel aliases).
    - Do NOT rename external references that must stay (e.g. `github.com/openclaw/openclaw` only if DECISION says so; upstream git remote).
12. Update `openclaw.mjs` entry: make it a re-export/exec shim of `operator.mjs` (or delete and point bin). Keep both files until cleanup step.

### Layer 4 — Docs, skills, agents, configs, CI

13. `docs/**`, `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `FAQ.md`, `SECURITY.md`, `OPERATORS.md`, etc.: replace `OpenClaw`→`Operator`, `openclaw`→`operator`, `Openclaw`→`Operator` in prose.
14. `.kilo/`, `.agents/`, `skills/` references to `openclaw` paths/commands.
15. `.github/` workflows, labeler, release scripts referencing `openclaw` binary / `@openclaw` / `OPENCLAW_*`.
16. `tsdown.config.ts`, `scripts/*`, `deploy/*`, `Dockerfile`, `docker-compose.yml`, `fly.toml`, `render.yaml` — rename binary invocations and paths.
17. `appcast.xml` and other generated artifacts: regenerate rather than hand-edit where a build step exists.

### Layer 5 — Tests & fixtures

18. Update test fixtures/tests that hardcode `openclaw.json`, `~/.openclaw`, `OPENCLAW_*`, `/tmp/openclaw.json`. Prefer shared test-helpers (e.g. `test-utils/openclaw-test-state.ts`) so the literal lives in one place, then update that helper.
19. Rename test helper files `openclaw-test-state.ts` → `operator-test-state.ts` and update imports.

### Layer 6 — Validation

20. `pnpm install` clean.
21. Typecheck: `pnpm tsgo` lanes (NOT `tsc --noEmit`).
22. Lint/format: `pnpm format` + repo lint wrappers.
23. Import-cycle check: `pnpm check:import-cycles`.
24. Build: `pnpm build` (watch for `[INEFFECTIVE_DYNAMIC_IMPORT]`).
25. Focused tests: `node scripts/run-vitest.mjs` on config-loading, doctor migration, env-var, and SDK-alias suites.
26. Smoke: run `operator doctor --fix` against a sample `openclaw.json` + `~/.openclaw` and verify migration to `operator.json`/`~/.operator`/`OPERATOR_*`.

## Decisions required (resolved)

- ✅ Rename published `@operator/*` → `@operator/*` and root `openclaw` → `operator`.
- ✅ Migrate `openclaw.json`/`~/.openclaw`/`OPENCLAW_*` via `operator doctor --fix`; canonical-only runtime (no silent fallback). Keep `openclaw` binary + `openclaw doctor` alias.
- ✅ Target casing: `operator` (CLI/pkg/path), `Operator` (title/prose).
- Open: whether `homepage`/`repository` URLs should point to `github.com/gabrielvfonseca/operator` (recommended) or stay `openclaw/openclaw`.

## Risks

- Massive diff → high chance of breakage in dynamic import specifiers and `openclaw/plugin-sdk` barrel aliases. Mitigate with Layer 1 first + install check.
- `OPENCLAW_*` appears in ~9.5k places incl. tests; automated replace must preserve exact var semantics (no partial matches like `OPENCLAW_X_*` variants).
- Lockfile (`pnpm-lock.yaml`) is a security surface and will change wholesale; review the diff.
- Package renames are internal workspace re-linking only — **no `pnpm publish` / no npm registry changes**. Consumers outside this monorepo are not affected and are out of scope.
- `openclaw.mjs` vs `operator.mjs`: operator.mjs already exists; confirm it is the canonical entry before deleting openclaw.mjs.

## Out of scope

- Changing git remotes (`upstream` stays openclaw/openclaw).
- **Publishing to npm / re-publishing `@operator/*` packages** (internal workspace rename only).
- Notifying external consumers / downstream migration.
- Renaming the GitHub org/repo itself.
