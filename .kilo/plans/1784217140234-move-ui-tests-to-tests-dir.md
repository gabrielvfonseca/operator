# Move Control UI tests from `ui/src` to `ui/tests`

## Goal

Move every test file currently living under `ui/src/` into a new top-level `ui/tests/` tree, preserving the existing page/component/lib/e2e layout. Move `ui/src/test-helpers/` into `ui/tests/helpers/` as well, because no production source imports those helpers. After the move, update Vitest includes/excludes, setup files, root references, and doc strings so `pnpm test` and `pnpm test:ui:e2e` still discover and run the same tests.

## Target structure

```
ui/
  tests/
    pages/
      workboard/
      worktrees/
      usage/
      skills/
      sessions/
      profile/
      plugins/
      plugin/
      nodes/
      new-session/
      model-providers/
      memory-import/
      logs/
      cron/
      config/
      chat/
        components/
      channels/
      approval/
      agents/
        memory/
      about/
      activity/
      connection/
      debug/
      route-provenance.test.ts
      ...
    components/
      terminal/
      sidebar/
      ...
    app/
    lib/
      chat/
      nodes/
      ...
    i18n/
      lib/
      test/
    e2e/
    helpers/
      lit-warnings.setup.ts
      control-ui-e2e.ts
      application-context.ts
      chat-model.ts
      cron.ts
      custom-theme.ts
      modal-dialog.ts
      storage.ts
      load-styles.ts
```

Files inside `ui/tests/helpers/` that are pure test code (`*.test.ts`) keep their test suffixes; helper modules do not.

## Move rules

1. **Preserve relative directory shape.** A file at `ui/src/pages/chat/foo.test.ts` becomes `ui/tests/pages/chat/foo.test.ts`.
2. **Move `ui/src/test-helpers/*` to `ui/tests/helpers/*`.** No re-export shims remain in `src/test-helpers/`.
3. **Do not move production files.** Anything under `ui/src/` that is not a `*.test.ts`, `*.spec.ts`, `*.e2e.test.ts`, `*.browser.test.ts`, `*.node.test.ts`, or inside `test-helpers/` stays in `ui/src/`.

## Files that must change

### `ui/vitest.config.ts`

- Update every `include` from `src/**/*.test.ts` → `tests/**/*.test.ts`
- Update every `exclude` from `src/**/*.browser.test.ts` / `src/**/*.e2e.test.ts` / `src/**/*.node.test.ts` → `tests/**/*.browser.test.ts` etc.
- Update `setupFiles: ["./src/test-helpers/lit-warnings.setup.ts"]` → `"./tests/helpers/lit-warnings.setup.ts"`
- Update `nodeDrivenBrowserLayoutTests` paths from `src/ui/chat/...` / `src/pages/chat/...` / `src/components/...` / `src/pages/sessions/...` → corresponding `tests/...` paths
- Update any internal alias or reference pointing at `src/test-helpers/...`

### `ui/vitest.node.config.ts`

- Update `include` from `src/**/*.node.test.ts`, `src/pages/chat/chat-responsive.browser.test.ts`, `src/pages/sessions/view.browser.test.ts` → `tests/**/*.node.test.ts`, `tests/pages/chat/chat-responsive.browser.test.ts`, `tests/pages/sessions/view.browser.test.ts`

### Root Vitest configs

- `tests/vitest/vitest.ui.config.ts`
  - Default `includePatterns` from `ui/src/**/*.test.ts` → `ui/tests/**/*.test.ts`
  - Exclude default from `ui/src/**/*.e2e.test.ts` → `ui/tests/**/*.e2e.test.ts`
  - `setupFiles: ["ui/src/test-helpers/lit-warnings.setup.ts"]` → `"ui/tests/helpers/lit-warnings.setup.ts"`
- `tests/vitest/vitest.ui-e2e.config.ts`
  - `uiE2eIncludePatterns` from `ui/src/**/*.e2e.test.ts` → `ui/tests/**/*.e2e.test.ts`

### Root `tests/vitest/vitest.shared.config.ts`

- The special-cased `ui/src/pages/chat/tool-stream.node.test.ts` include must become `ui/tests/pages/chat/tool-stream.node.test.ts`

### Root `scripts/control-ui-mock-dev.ts`

- Update the import `from "../ui/src/test-helpers/control-ui-e2e.ts"` → `"../ui/tests/helpers/control-ui-e2e.ts"`
- Update any string references to `ui/src/e2e/...` test paths used for routing or mock scenario selection

### Root `docs/reference/test.md` and any docs mentioning `ui/src/**/*.e2e.test.ts` or `ui/src/test-helpers/`

- Update path examples to `ui/tests/**/*.e2e.test.ts` and `ui/tests/helpers/control-ui-e2e.ts`

### Root test scripts / helpers that reference `ui/src/...test`

- `tests/scripts/test-projects.test.ts`
- `tests/scripts/test-projects.test-support.mjs`
- `tests/vitest-scoped-config.test.ts`
- `tests/vitest-projects-config.test.ts`
- `tests/vitest-unit-config.test.ts`
- `tests/vitest-unit-paths.test.ts`
- `tests/scripts/test-skip-inventory.test.ts`
- `tests/scripts/run-vitest.test.ts`
- `tests/scripts/ci-workflow-guards.test.ts`
- `extensions/qa-lab/src/test-file-scenario-runner.test.ts`
- `extensions/qa-lab/src/suite-planning.test.ts`
- `extensions/qa-lab/src/scenario-catalog.test.ts`
- `extensions/qa-lab/src/run-config.test.ts`
- `extensions/qa-lab/src/coverage-report.test.ts`
- `src/scripts/test-projects.test.ts`
- `src/scripts/ci-changed-scope.test.ts`

For each, replace `ui/src/` test path references with `ui/tests/`.

### `.github/workflows/mantis-web-ui-chat-proof.yml`

- Replace `ui/src/e2e/mantis-chat-proof.e2e.test.ts` and `ui/src/test-helpers/control-ui-e2e.ts` with `ui/tests/...` equivalents.

### `.agents/skills/control-ui-e2e/SKILL.md`

- Update `ui/src/**/*.e2e.test.ts` and `ui/src/test-helpers/control-ui-e2e.ts` references.

### `.oxlintrc.json`

- Replace `ui/src/**/*.test.*` with `ui/tests/**/*.test.*`

## What must NOT change

- Any import inside `ui/src/**/*.ts` that points at another `ui/src/...` non-test module. Those are production imports and must stay untouched.
- `ui/src/e2e/` or `ui/src/test-helpers/` directories themselves after move; they should be removed empty.

## Validation plan

1. Run `pnpm --dir ui test` and confirm the `unit`, `unit-node`, and `browser` projects discover the same test count as before.
2. Run `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner` with a narrow explicit target such as `ui/tests/e2e/about.e2e.test.ts` to prove e2e discovery works.
3. Run `pnpm test:ui` from repo root to confirm the root wrapper still works.
4. Run `git diff --check` and targeted lint/format on touched config/doc files.
5. Grep the repo for stale `ui/src/test-helpers/` and `ui/src/e2e/` references that should have been updated; fail if any remain.
