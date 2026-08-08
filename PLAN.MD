# Plan: Remove oxfmt/oxlint, replace with Biome + Ultracite

## Summary

Replace the oxfmt (formatter) + oxlint (linter) toolchain with **Biome** driven by **Ultracite** (`ultracite.json` extends Biome). This removes the oxfmt/oxlint binaries, the `.oxlintrc.json` config, the sharded oxlint runners, the oxfmt docs formatter, all oxlint-specific repo policies (max-lines budget, `oxlint-disable` ratchet, type-aware unused-directive checks), and rewrites the package scripts, CI, and change-classification routing to use `biome check`. Tests that assert oxlint-specific behavior are deleted per the agreed scope.

Biome is already installed (`node_modules/.bin/biome` present) and `biome.json`/`ultracite.json` already exist as unused stubs — we promote them to the active config and delete the oxfmt/oxlint toolchain.

## Context

- Formatter is currently `oxfmt` (scripts: `format`, `format:check`, `format:diff`, `format:fix`, `format:docs` via `scripts/format-docs.mjs`).
- Linter is currently `oxlint` via `scripts/run-oxlint.mjs` (+ `.d.mts`) and `scripts/run-oxlint-shards.mjs` (+ `.d.mts`), configured by `.oxlintrc.json` (366 lines, ~200 rules) and 4 `config/tsconfig/oxlint*.json` tsconfigs.
- `scripts/lib/local-heavy-check-runtime.mjs` owns `applyLocalOxlintPolicy` / `shouldAcquireLocalHeavyCheckLockForOxlint` and `OPENCLAW_OXLINT_*` env vars; these are also asserted in `test/scripts/run-oxlint.test.ts`.
- Change classification (`scripts/check-changed.mjs`, `scripts/changed-lanes.mjs`, `scripts/ci-changed-scope.mjs`, `scripts/lib/changed-path-facts.mjs`) routes per-directory lint via `node scripts/run-oxlint.mjs --tsconfig ...` and formatting via oxfmt.
- CI (`ci.yml`) runs `node scripts/run-oxlint.mjs src ui/src packages extensions` and `pnpm format:check`.
- Biome config stubs already exist: `biome.json` (formatter+linter disabled-ish) and `ultracite.json` (extends schema `https://ultracite.ai/schema.json`). These become the real config.

### Env-var naming note
Repo convention uses `OPENCLAW_*` prefixes in tests (e.g. `OPENCLAW_OXLINT_SHARD_*`) even though the production scripts set `OPERATOR_OXLINT_*`. The heavy-check lock reads `OPERATOR_OXLINT_*`. Both production (`OPERATOR_*`) and test (`OPENCLAW_*`) names for oxlint are being removed; biome equivalents will use `OPERATOR_BIOME_*` (production) — no `OPENCLAW_*` test assertions remain since those test files are deleted.

## System Impact

- **Source of truth for lint/format rules** moves from `.oxlintrc.json` + `.oxfmtrc.jsonc` to `biome.json` + `ultracite.json`.
- **Lint execution** moves from `oxlint` binary + sharded runner to `biome check --write` (lints and formats in one pass).
- **Custom repo policies dropped**: `max-lines` budget, the `oxlint-disable` ratchet allowlist (`check-max-lines-ratchet.mjs`), `report-unused-disable-directives`, type-aware tsconfig-driven lint, `--type-aware`. Biome has no native max-lines; that policy is removed entirely (no standalone replacement) per the agreed scope.
- **Change-classification routing** switches targeted lint/format commands from oxlint/oxfmt to `biome check`.
- **Dependencies**: remove `oxfmt`, `oxlint`, `oxlint-tsgolint`; add `@biomejs/biome` (already present in node_modules but not declared — must be pinned in `package.json` and lockfile regenerated).
- **Tests**: test files asserting oxlint/oxfmt behavior are deleted; `biome.json`/`ultracite.json` remain as config (no tests assert them unless we add a minimal one — out of scope).

## Approach

1. **Config (promote stubs to real)**: rewrite `biome.json` to import Ultracite (`"extends": ["./ultracite.json"]`), keep ignore list, formatter line width 100 to match `.oxfmtrc.jsonc` (`printWidth: 100`) — note AGENTS.MD says 80 but the actual oxfmt config and repo use 100; keep 100 to avoid reformatting the whole tree. Rewrite `ultracite.json` to a clean Ultracite config (lineWidth 100, 2-space, includes JS/TS/JSON/package.json). Delete `.oxlintrc.json`, `.oxfmtrc.jsonc`, and `config/tsconfig/oxlint*.json` (4 files).
2. **Format scripts**: point `format`, `format:check`, `format:diff`, `format:fix` at `biome format`/`biome check`. Repoint `format-docs.mjs` to format markdown via `biome format` (Biome formats MD/JSON too) instead of oxfmt; keep the Mintlify accordion repair step.
3. **Lint scripts**: `lint`, `lint:all`, `lint:core`, `lint:extensions`, `lint:scripts`, `lint:fix` to `biome check` over the relevant roots. Remove the sharded oxlint runner scripts and their `.d.mts` decls.
4. **Heavy-check runtime**: remove `applyLocalOxlintPolicy`, `shouldAcquireLocalHeavyCheckLockForOxlint`, and `hasOxlintFormatArg`; add `applyLocalBiomePolicy` (keep lock + memory policy; Biome has no thread flag) and `shouldAcquireLocalHeavyCheckLockForBiome`. Rename `OPERATOR_OXLINT_*` env to `OPERATOR_BIOME_*`.
5. **Change classification**: in `check-changed.mjs`/`changed-lanes.mjs`/`ci-changed-scope.mjs`/`changed-path-facts.mjs`, replace `createTargetedOxlintCommand` with `createTargetedBiomeCommand` (`biome check <paths>`) and oxfmt format check with `biome check`/format; update `changedCheckLocalDependenciesReady` (drop `oxfmt` bin check), `createChangedCheckChildEnv` (`OPERATOR_BIOME_SKIP_LOCK`), and neutral/path matchers (`.oxlintrc.json$`/`.oxfmtrc.jsonc$` to `biome.json$`/`ultracite.json$`).
6. **CI**: `ci.yml` `node scripts/run-oxlint.mjs src ui/src packages extensions` to `pnpm lint`; `pnpm format:check` stays. `crabbox-hydrate.yml` oxlint ref to `pnpm lint`.
7. **Docs/AGENTS**: update `AGENTS.MD` formatting line (`oxfmt` to `biome`/`biome check`), `scripts/AGENTS.MD` and `scripts/README.MD` oxlint references to biome, and `.agents/skills/*` `oxfmt` invocations to `biome format`/`biome check`.
8. **Dependencies + lockfile**: remove `oxfmt`/`oxlint`/`oxlint-tsgolint` from `package.json` devDependencies; add `@biomejs/biome` pinned; regenerate `pnpm-lock.yaml` (`pnpm install`).
9. **Delete tests asserting oxlint/oxfmt behavior**: `test/scripts/run-oxlint.test.ts`, `test/scripts/oxlint-config.test.ts`, `test/scripts/lint-suppressions.test.ts`, `test/scripts/format-docs.test.ts`. Update `test/scripts/changed-lanes.test.ts`, `test/scripts/ci-workflow-guards.test.ts`, `test/scripts/local-heavy-check-runtime.test.ts` to remove oxlint/oxfmt-coupled imports/assertions. `check-max-lines-ratchet.mjs` script and `check:max-lines-ratchet` package script: remove (policy dropped).
10. **Code cleanups**: `scripts/changed-lanes.mjs` `oxlint-disable-next-line` comments to `biome-ignore` or removed; `scripts/lib/format-generated-module.mjs` oxfmt call to biome; `scripts/check-changed.mjs` references consistent.

## Changes (file-by-file)

### Config
- `biome.json` — `{"extends":["./ultracite.json"],"files":{"ignore":["dist/**","node_modules/**","bun.lockb",".artifacts/**","**/*.min.js","**/*.d.ts"]}}` (Ultracite owns formatter+linter).
- `ultracite.json` — clean Ultracite config: `lineWidth: 100`, indent 2, `enabled: true` for formatter+linter, include JS/TS/JSON, disable `noExplicitAny`/`noUnnecessaryTypeParameters`-style noise to match repo's `any` tolerance (mirror existing `no-explicit-any:off` policy from `.oxlintrc.json`).
- Delete `.oxlintrc.json`, `.oxfmtrc.jsonc`, `config/tsconfig/oxlint.json`, `config/tsconfig/oxlint.core.json`, `config/tsconfig/oxlint.extensions.json`, `config/tsconfig/oxlint.scripts.json`.

### package.json
- Scripts `format*`, `lint*`, `check:max-lines-ratchet` rewritten to biome; remove `oxfmt`/`oxlint`/`oxlint-tsgolint` devDeps; add `@biomejs/biome`.

### scripts (lint engine)
- Delete `scripts/run-oxlint.mjs`, `scripts/run-oxlint.d.mts`, `scripts/run-oxlint-shards.mjs`, `scripts/run-oxlint-shards.d.mts`.
- `scripts/lib/local-heavy-check-runtime.mjs` — replace oxlint policy/lock helpers with biome equivalents (`applyLocalBiomePolicy`, `shouldAcquireLocalHeavyCheckLockForBiome`, `hasBiomeFormatArg`), `OPERATOR_BIOME_*` env.
- `scripts/check-changed.mjs` — `createTargetedOxlintCommand` to `createTargetedBiomeCommand`; rename tsconfig consts; `createChangedCheckChildEnv` uses `OPERATOR_BIOME_SKIP_LOCK`; `changedCheckLocalDependenciesReady` drops oxfmt check; path matchers updated.
- `scripts/changed-lanes.mjs` — `oxlint-disable-next-line` comments to `biome-ignore`; import of `resolveOxfmtInvocation` removed; oxlint-targeted command builders updated.
- `scripts/format-docs.mjs` — replace oxfmt invocation with `biome format` (MD/JSON); keep accordion repair; rename exports (`resolveBiomeInvocation`, `runBiome`).
- `scripts/lib/format-generated-module.mjs` — oxfmt to biome format.
- `scripts/check-max-lines-ratchet.mjs` — delete (max-lines policy dropped).

### CI
- `.github/workflows/ci.yml` — `node scripts/run-oxlint.mjs src ui/src packages extensions` to `pnpm lint`.
- `.github/workflows/crabbox-hydrate.yml` — oxlint ref to `pnpm lint`.

### Docs / AGENTS
- `AGENTS.MD` — formatting line `oxfmt` to `biome check`.
- `scripts/AGENTS.MD`, `scripts/README.MD` — oxlint to biome references.
- `.agents/skills/*/SKILL.md` (`operator-refactor-docs`, `operator-ci-limits`, `operator-docker-e2e-authoring`) — `oxfmt` invocations to `biome format`/`biome check`.

### Tests (delete or surgically edit)
- Delete `test/scripts/run-oxlint.test.ts`, `test/scripts/oxlint-config.test.ts`, `test/scripts/lint-suppressions.test.ts`, `test/scripts/format-docs.test.ts`.
- Edit `test/scripts/changed-lanes.test.ts`, `test/scripts/ci-workflow-guards.test.ts`, `test/scripts/local-heavy-check-runtime.test.ts`: remove oxlint/oxfmt-coupled imports and assertions only.

## Verification

- `pnpm install` (regenerate lockfile, confirm oxfmt/oxlint gone, biome present).
- `pnpm format:check` and `pnpm format` smoke-test on a few files.
- `pnpm lint` runs `biome check` (full repo may surface Biome-vs-oxlint diffs; expected and out of scope to fully fix, but the command must be configured and run).
- `node scripts/check-changed.mjs --staged` (dry-run) routes biome commands for changed `.ts` files.
- Surviving targeted tests: `node scripts/run-vitest.mjs test/scripts/changed-lanes.test.ts test/scripts/ci-workflow-guards.test.ts test/scripts/local-heavy-check-runtime.test.ts`.
- `git grep -i "oxlint\|oxfmt" -- ':!pnpm-lock.yaml' ':!CHANGELOG.MD'` returns nothing.
- `pnpm build` to confirm no script still references deleted runners.

## Risks

- Biome and oxlint disagree on some rules; a full `biome check` may report pre-existing findings. The migration makes biome the configured linter; fixing every finding across the tree is explicitly out of scope (per "drop custom rules"). We align `ultracite.json` to the repo's tolerance (e.g. `any`, `noUnnecessaryTypeParameters`) to minimize noise.
- `pnpm-lock.yaml` regeneration must keep other deps stable (lockfile is a security surface per AGENTS.MD).
