# Operator Monorepo Runtime & Tooling Refactor Plan

## Goals

- Replace pnpm with Bun as the sole package manager and runtime.
- Remove all pnpm artifacts (`pnpm-lock.yaml`, `pnpm-workspace.yaml`, pnpm scripts, pnpm CI steps).
- Rewrite `bunfig.toml` with correct aliases, tasks, and install config.
- Add `ultracite.json` and align `biome.json` with the project's lint/format rules.
- Extract all shared `tsconfig` bases into a new `packages/typescript-config` package and convert every local tsconfig to `extends` from it.
- Move root `/sdk` → `/sdks/operator-sdk` and `packages/plugin-sdk` → `/sdks/plugin-sdk`, updating all imports.
- Move test files colocated inside `packages/*/src/**` into sibling `packages/*/tests/**`, then update imports and vitest configs.

## Phase 1 — Strip pnpm and set Bun as the runtime

### 1.1 Delete pnpm artifacts

- Remove `pnpm-lock.yaml`, `pnpm-lock 2.yaml`, `pnpm-workspace.yaml`.
- Remove `npm-shrinkwrap.json` (Bun uses its own lockfile).
- Remove scripts that reference pnpm by name (`scripts/pnpm-runner.mjs`, `scripts/pre-commit/pnpm-audit-prod.mjs`, etc.).

### 1.2 Update root `package.json`

- Replace all `pnpm` CLI invocations in `scripts` with `bun`.
- Replace workspace protocol `workspace:*` deps with Bun workspace protocol (`workspace:*` is already supported by Bun, but verify all package manager references).
- Update `files`, `exports`, and any pnpm-specific metadata.
- Add `"packageManager": "bun"` field.
- Ensure `bin` entry (`operator.mjs`) and entrypoints are Bun-compatible.

### 1.3 Rewrite `bunfig.toml`

Current file has stale aliases and an old node version (`18.0.0`).

- Set `nodeVersion = "24.0.0"` (matches repo's Node 24 requirement per AGENTS.md).
- Set `nodeModules = "bun"` (or keep `"bun:node"` if hybrid is needed; prefer pure `"bun"`).
- Update `alias` map to match actual post-move paths:
  - `@operator/*` → `./src/*`
  - `@operator` → `./src`
  - `@extensions/*` → `./extensions/*`
  - `@sdk/*` → `./sdks/*` (after SDK moves)
  - Remove stale `@packages/*` and `@ui/*` aliases unless actively used.
- Update `transpile` excludes to cover `tests/**`, `skills/**`, `extensions/**` as appropriate.
- Update `build.external` and `tasks` to Bun-native equivalents.
- Remove `experimental` flags that no longer apply.

### 1.4 Create `bun.lockb`

- Run `bun install` to generate the new lockfile.
- Verify install completes without pnpm.

## Phase 2 — Lint / Format / Ultracite

### 2.1 Create `ultracite.json`

- Use the `recommended` or explicit rule set matching current Biome strictness.
- Map existing `biome.json` rules into Ultracite config (indent 2 spaces, line width 80, noImplicitAny, preferForEach, noUnusedVariables).
- Ensure it covers `*.{ts,tsx,js,mjs}`.

### 2.2 Align `biome.json`

- Keep Biome as the formatter if the project prefers it, or switch entirely to Ultracite/Oxfmt.
- Per AGENTS.md, formatting is `oxfmt`, not Prettier. Align `biome.json` and `ultracite.json` so they do not conflict.
- Add `biome.json` ignore patterns for generated `dist/`, `node_modules/`, `bun.lockb`.

### 2.3 Update root scripts

- Replace any `oxfmt` or Biome-specific npm script references with Bun-run equivalents.
- Ensure `pnpm format` → `bun run format` (or `bun x oxfmt`).

## Phase 3 — `packages/typescript-config`

### 3.1 Create package

- New directory: `packages/typescript-config/`
- Add `package.json` (name: `@operator/typescript-config`, private, type module).
- Add `src/` with rule-set files:
  - `base.json` — shared strict compiler options (target es2023, module NodeNext, strict, noUncheckedIndexedAccess, verbatimModuleSyntax, etc.).
  - `core.json` — extends base, adds `include: ["src/**/*"]`, root-level paths.
  - `extensions.json` — extends base, adds extension-specific paths/excludes.
  - `package.json` — extends base, for bundled packages.
  - `test.json` — extends base, adds vitest types, includes tests.
  - `e2e.json` — extends base, adds DOM libs for UI/e2e.
- Each file exports a JSON object; consumers use `"extends": "@operator/typescript-config/base"`.

### 3.2 Migrate root tsconfigs

Current root tsconfigs:

- `tsconfig.json`
- `tsconfig.core.json`
- `tsconfig.core.projects.json`
- `tsconfig.extensions.json`
- `tsconfig.extensions.projects.json`
- `tsconfig.plugin-sdk.dts.json`
- `tsconfig.projects.json`
- `tsconfig.scripts.json`
- `tsconfig.ui.json`

For each:

- Move shared compiler options into `packages/typescript-config/src/*.json`.
- Replace local content with `"extends": "@operator/typescript-config/<profile>"` plus only the delta (paths, include, exclude).
- Update `tsconfig.json` paths to point to new SDK locations (`@operator/sdk` → `./sdks/operator-sdk/src/index.ts`, `@operator/plugin-sdk` → `./sdks/plugin-sdk/src/index.ts`).

### 3.3 Migrate package tsconfigs

- For every `packages/*/tsconfig.json` and `extensions/*/tsconfig.json`:
  - Replace with `"extends": "@operator/typescript-config/<profile>"`.
  - Keep only package-specific `compilerOptions` overrides (paths, outDir, composite).
- Update `packages/plugin-sdk/tsconfig.json` to point to new location logic after the move (this tsconfig will itself move to `sdks/plugin-sdk/tsconfig.json`).

### 3.4 Update references

- Search/replace all imports and config references that use relative paths into old tsconfig locations.
- Ensure vitest configs (`vitest.config.ts`, `test/tsconfig/*.json`) extend the new shared configs.

## Phase 4 — SDK restructuring

### 4.1 Move `/sdk` → `/sdks/operator-sdk`

- Rename directory `sdk/` → `sdks/operator-sdk/`.
- Update `sdks/operator-sdk/package.json`:
  - Name: `@operator/operator-sdk` (or keep `@operator/sdk` if that is the published name; confirm with the team).
  - Update `exports` paths if they referenced `./dist` relative to old location.
- Move or copy `node_modules` if needed (Bun will resolve workspace deps).

### 4.2 Move `packages/plugin-sdk` → `sdks/plugin-sdk`

- Move directory `packages/plugin-sdk/` → `sdks/plugin-sdk/`.
- Update `sdks/plugin-sdk/package.json` name to `@operator/plugin-sdk` (keep existing name).
- Update all internal imports within the plugin-sdk package.
- Update root `package.json` `exports` entries that point to `./dist/plugin-sdk/*` — these may need path adjustments if the build output path changes, or keep `dist/plugin-sdk` if the build still emits there from the new location.

### 4.3 Update all import references

- Grep for:
  - `from "@operator/sdk"`
  - `from "@operator/plugin-sdk"`
  - `from "operator/plugin-sdk"`
  - `from "./packages/sdk/"`
  - `from "./packages/plugin-sdk/"`
  - `from "../sdk/"`
  - `from "../../sdk/"`
- Replace with new paths under `sdks/`.
- Update `tsconfig.json` path mappings.

### 4.4 Update workspace / monorepo references

- Update any workspace tooling configs (Turborepo, Nx, etc.) if present.
- Update root `package.json` `directories.test` and any other structural references.

## Phase 5 — Test files reorganization

### 5.1 Audit packages with colocated tests

Packages known to have tests inside `src/`:

- `packages/normalization-core`
- `packages/terminal-core`
- `packages/ai`
- `packages/memory-host-sdk`
- `packages/speech-core`
- `packages/markdown-core`
- `packages/llm-core`
- `packages/agent-core`
- `packages/acp-core`
- `packages/model-catalog-core`
- `packages/media-core`
- `packages/tool-call-repair`
- `packages/plugin-package-contract`

### 5.2 Move test files

For each affected package:

- Create `tests/` directory alongside `src/`.
- Move every `*.test.ts`, `*.e2e.test.ts`, and test helper file from `src/` into `tests/`.
- Update internal relative imports within moved test files.
- Update the package `tsconfig.json` to include `tests/**/*` in `include`.
- Update `vitest.config.ts` or root vitest project config to include the new test paths.

### 5.3 Update root vitest config

- Ensure `vitest.config.ts` projects array references the new `tests/` paths.
- Update any test-helper imports that traversed into `src/`.

## Phase 6 — GitHub Actions / CI-CD

### 6.1 Audit pnpm references

There are ~300 pnpm references across workflows. Common patterns:

- `uses: pnpm/...` actions
- `run: pnpm install`
- `run: pnpm build`
- `run: pnpm test`
- `run: pnpm operator ...`
- Cache steps for `~/.pnpm-store`

### 6.2 Replace with Bun equivalents

- `actions/setup-node` → keep if needed, but prefer `oven-sh/setup-bun` or `bun-actions/setup-bun`.
- `pnpm install` → `bun install`.
- `pnpm build` → `bun run build` (or `bun run scripts/build-all.mjs`).
- `pnpm test` → `bun test` or `bun x vitest run`.
- `pnpm operator ...` → `bun run operator ...`.
- Remove pnpm cache steps; replace with Bun cache (`actions/cache` on `~/bun/install`).
- Update any matrix `node-version` to Node 24.

### 6.3 Update reusable workflows

- `openclaw-cross-os-release-checks-reusable.yml`
- `install-smoke-reusable.yml`
- `ci-build-artifacts-testbox.yml`
- `ci-check-arm-testbox.yml`
- Any workflow under `.github/workflows/.github/actions/` that sets up pnpm.

### 6.4 Verify Dockerfiles and installers

- `Dockerfile`, `docker-compose.yml`, sibling installer repos may reference pnpm.
- Update to `bun install` / `bun run` where applicable.

## Phase 7 — Validation

### 7.1 Local validation

- Run `bun install` from repo root. Confirm no pnpm artifacts remain.
- Run `bun run build` and `bun run test` (or equivalent).
- Run `bun x tsc --noEmit` (or `tsgo`) on root and package tsconfigs to confirm extends resolve.
- Run `bun x biome check` or `bun x ultracite check` on a subset of files.
- Run `bun run lint` / `bun run format` if scripts exist.

### 7.2 Type-check all packages

- For each package and extension with a tsconfig, run `tsc --noEmit` (or `tsgo`) to verify the new `@operator/typescript-config` extends resolve correctly.

### 7.3 CI validation

- Push to a feature branch and trigger the main CI workflow.
- Confirm all jobs that previously used pnpm now use Bun and pass.
- Confirm artifact upload/download paths still work.
- Confirm no references to `pnpm-lock.yaml` remain in workflow triggers or paths.

## Risks & Mitigations

| Risk                                                                              | Mitigation                                                                                                |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Bun lockfile incompatibilities with native deps (sqlite-vec, protobufjs, esbuild) | Run `bun install` locally first; if a dep fails, patch or pin the version.                                |
| `workspace:*` protocol differences between pnpm and Bun                           | Bun supports `workspace:*`; verify with a test install.                                                   |
| Massive import breakage after SDK moves                                           | Use codemods or `ts.replaceInFiles` to batch-rewrite paths; run `tsc --noEmit` after each batch.          |
| Vitest project config references old test paths                                   | Update vitest configs in same pass as test moves; run `bun test` to verify.                               |
| CI workflow YAML syntax errors after bulk replace                                 | Lint workflows with `actionlint` before pushing.                                                          |
| Published package paths (`dist/plugin-sdk/*`) change                              | Keep build output paths stable; only move source. Update `exports` only if build output location changes. |

## Open Questions

1. Should `@operator/sdk` keep its existing npm name, or should the rename to `@operator/operator-sdk` also apply to the published package name?
2. Should `packages/typescript-config` be published to npm, or kept private?
3. Do we keep `npm-shrinkwrap.json` for any reason, or is Bun's lockfile sufficient for the whole repo?
4. Should the test move be limited to `packages/*` only, or also apply to `src/` and `extensions/*`?
