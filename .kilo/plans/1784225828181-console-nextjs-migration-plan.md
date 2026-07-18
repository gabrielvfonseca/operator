# Migrate `/ui` (Lit/Vite SPA) → `apps/console` (Next.js + shadcn Base UI) + new `design-system` package

## Status: SCAFFOLD IMPLEMENTED + VALIDATED (Phases 0–3 complete; /ui still serving)

## Progress log

- **Phase 0 — repo wiring:** `pnpm-workspace.yaml` lists `apps/console` and `design-system` (explicit, not `apps/*`). Root `tsconfig.json` has explicit `@operator/design-system` / `@operator/design-system/*` aliases before the `@operator/* → ./extensions/*` catch-all. Both were missing from disk at validation time and were added. (Canonical manager is **pnpm** — committed `packageManager: pnpm@11.2.2`; a separate in-progress rebrand set `packageManager: bun` + `bunfig.toml` in the working tree, which is unrelated to this plan and left untouched.)
- **Phase 1 — `design-system` package:** `name: @operator/design-system`, `@base-ui/react` v1.6.0. Seed components: `button`, `input`, `card`, `badge`, `separator`, `tabs`, `dialog`, `tooltip`, `switch`, `select`. `lib/utils.ts` (`cn`), `theme/styles.css` (tokens preserving legacy `claw`/`knot`/`dash` + light/dark), `theme/theme.ts` (legacy settings-key resolver — fixed to `openclaw.control.settings.v1` to match `ui/src/app/settings.ts`; earlier draft wrongly used `operator.control.settings.v1`), and `index.ts` barrel.
- **Phase 2 — `apps/console` scaffold:** Next.js 15 App Router, `output: "standalone"`, `basePath: /control-ui`, Tailwind **v4** (`@tailwindcss/postcss`, CSS-first `@theme inline`). `package.json` name `@operator/console`, dep `@operator/design-system: workspace:*`. `layout.tsx` inline theme bootstrap (no flash) + `AppShell`; removed a dead `ThemeBootstrap` function that was never called. `lib/gateway-client.ts` (WS hello/ping) and `lib/use-theme-sync.ts`. `env.ts` build-info. `gateway-client` URL fixed to target the gateway host root (same-origin when proxied) via `NEXT_PUBLIC_OPERATOR_GATEWAY_URL`, not a fabricated `/api/gateway` path.
- **Phase 3 — first migrated page:** `src/app/about/page.tsx` ported from `ui/src/pages/about/about-page.ts` using design-system components. App shell shows sidebar nav + topbar with live gateway status.
- **Validation:** both packages typecheck clean in isolation (`tsc --noEmit`, exit 0) after fixes. `@base-ui/react/*` subpaths present in export map; design-system `exports` map resolves `.` and `./styles.css`. `pnpm install` blocked repo-wide by a **pre-existing, unrelated** lockfile policy failure on `@operator/libterminal@0.3.2` (already listed in `minimumReleaseAgeExclude` but still flagged against the committed `pnpm-lock.yaml`) — not caused by these changes. A real `next build` therefore couldn't run from the workspace; build soundness validated via isolated dependency resolution + typechecking.

## Open follow-ups (still pending)

- `pnpm install` / real `next build` gated on resolving the pre-existing `libterminal` lockfile policy violation (separate from this work).
- Phase 4: gateway proxy handler (`src/gateway/control-ui.ts`) to forward `/control-ui` → standalone Next server; plan `rewrites`/proxy. `gateway-client.ts` currently targets the gateway host root; Phase 5 adds the `/control-ui/api` + `/control-ui/ws` proxy rewrites.
- Remaining ~29 page routes (incremental migration).
- Phase 5/6: docker packaging + cutover.

Decisions confirmed with the user:

- **Scope:** Scaffold + incremental. Create the new app + design-system package now; migrate pages page-by-page behind a route bridge. `/ui` keeps serving until the new app reaches feature parity.
- **Serving:** New runtime — a standalone Next.js server, with the gateway proxying `/control-ui` (or a configured base path) to it. The legacy static `dist/control-ui` hosting stays until the cutover.
- **Component library:** shadcn primitives built on **Base UI** (Radix-free) — package `@base-ui/react` (v1.6.0; formerly `@base-ui-components/react`) — in a `design-system` package.
- **Name:** `apps/console`, app display name "Operator Console".
- **Package scope:** the repo is mid-rebrand to the `@operator` scope. Published/workspace package names use `@operator/*` (confirmed: root package `name` is `operator`; extensions are `@operator/voice-call`, `@operator/diffs`, etc.). New packages therefore are `@operator/console` and `@operator/design-system`.

## Naming & scope conventions (rebrand is mid-flight — read carefully)

The `@operator` → `@operator` rename is partially complete:

- **Package identity (`name` fields, `pnpm --filter`, npm publish, `workspace:*` deps):** use **`@operator/*`**. New packages: `@operator/console`, `@operator/design-system`.
- **Internal source path aliases in root `tsconfig.json`:** still **`@operator/*`** (e.g. `@operator/gateway-client`, `@operator/media-core`, `@operator/normalization-core`, `@operator/uirouter`). Do **not** invent new `@operator/*` tsconfig aliases for existing `packages/*`; reuse the existing `@operator/*` aliases when the console/design-system code imports current workspace packages. Only the two NEW packages get `@operator/*` aliases.
- If a broader alias rename lands separately, follow it; do not preemptively rename existing `@operator/*` aliases in this plan.

## Context (why this is constrained)

`/ui` is not a standalone app. It is embedded in the product:

- Built to `dist/control-ui`; served by the gateway via `src/infra/control-ui-assets.ts` + `src/gateway/control-ui.ts` (`gateway.controlUi.root`, `basePath`, `terminalEnabled`).
- ~30 page routes registered in `ui/src/app-routes.ts` via a custom router `@operator/uirouter` (internal alias not yet rebranded).
- Custom i18n pipeline: `ui/src/i18n/*` + `scripts/control-ui-i18n*.ts`, with `ui:i18n:*` package scripts and CI gates (`*i18n:check`, locale-refresh workflow).
- ~100+ source files; deps include `lit`, `@awesome.me/webawesome`, `@lit/context`, codemirror, ghostty-web, gateway-client, workboard-contract, etc.
- 3500+ cross-repo references to `control-ui`/`ui` across CI workflows, docker, docs (`docs/web/control-ui.md`), QA scenarios (`qa/scenarios/ui/*.yaml`), and tests (`tests/**`, `ui/tests/**`).
- A service worker (`public/sw.js`, stale-chunk reload) and `index.html` mount-fallback bootstrap.

Because of this, **the migration is staged and reversible**. The new app runs alongside `/ui`; pages flip one at a time. We never break the live Control UI mid-migration.

## Constraints / non-goals

- Do **not** delete `/ui` in this plan's scaffold phase. Deletion is a separate, later cutover step gated on parity + QA.
- Do **not** rewrite gateway auth, avatar/assistant-media, CSP, or bootstrap-config logic. The proxy reuses the existing auth/scope checks; only asset serving is delegated to the Next server.
- React/Next + Lit do not share DOM/web-component boundaries directly. The new app reuses **data/logic** from `ui/src/api/*`, `ui/src/lib/*`, `ui/src/i18n/*` only where they are framework-agnostic TS (no `lit` imports). Lit custom elements are not imported into React.
- Tailwind + shadcn replace Web Awesome. Visual parity is a goal but not pixel-exact.

## Target layout

```
apps/
  console/                      # NEW Next.js app ("Operator Console")
    package.json                # name: @operator/console
    next.config.mjs             # standalone output, rewrites/proxy to gateway for /api & ws
    tsconfig.json               # extends root; @operator/design-system alias; existing @operator/* aliases reused
    tailwind.config.ts
    postcss.config.mjs
    components.json             # shadcn config -> Base UI, alias @/components, src/components/ui
    src/
      app/
        layout.tsx              # root: providers (Theme, Query, DesignSystem), font, mount-fallback
        globals.css             # tailwind + design tokens (theme: claw/knot/dash, light/dark)
        (console)/              # route group mirroring legacy pages
          page.tsx              # redirect -> /chat or dashboard
          chat/page.tsx
          sessions/page.tsx
          ... (one per migrated route)
      components/
        ui/                     # shadcn-generated Base UI components (Button, Dialog, ...)
        shell/                  # sidebar, topbar, resizable layout (rebuilt with design-system)
        ...
      lib/
        gateway-client.ts       # browser gateway client (migrated from ui/src/api/*)
        i18n/                   # framework-agnostic i18n lib + React bindings (react-i18next or custom)
        hooks/                  # subscriptions, poll controllers (ported from ui/src/lit/*)
      config/
        routes.ts               # route path map (kept path-compatible with legacy)
    public/
  console-e2e/                  # (optional) Playwright specs mirroring ui/tests
design-system/                   # NEW shared component package
  package.json                  # name: @operator/design-system
  tsconfig.json
  src/
    index.ts                    # barrel
    components/                 # shadcn Base UI components live here (committed)
    theme/                      # tokens, cn(), utils
    hooks/                      # shared hooks
```

## Phase 0 — Repo wiring (foundation, no behavior change)

1. Register both new packages in the workspace so `pnpm` resolves them. The workspace is defined in `pnpm-workspace.yaml` (confirmed globs: `.`, `ui`, `packages/*`, `extensions/*`, `examples/*`). Add `apps/*` (or explicit `apps/console`) and `design-system` to `packages:`. Note: `apps/` currently only holds the Android app + `.i18n` bundles (no JS workspace member yet), so adding `apps/*` is new — verify it does not accidentally pull `apps/android`/`apps/.i18n` into pnpm as packages (prefer explicit `apps/console`).
2. Add path aliases in root `tsconfig.json` `paths`: `@operator/design-system` → `design-system/src/index.ts` (and `@operator/design-system/*` if subpath exports are used). Keep all existing `@operator/*` and `ui` paths intact.
3. Add a Next-aware lint/typecheck lane that is **opt-in** (do not let `pnpm lint`/`tsgo` fail the whole repo yet). Use `scripts/run-oxlint.mjs` and `scripts/run-tsgo.mjs` configs scoped to the new dirs. Note `pnpm-workspace.yaml` sets `nodeLinker: hoisted` and `blockExoticSubdeps: true` — Next/React/Base UI deps must satisfy the hoisted linker and release-age policy (`minimumReleaseAge: 2880`); pin versions and add exclusions to `minimumReleaseAgeExclude` if a needed version is newer than the age gate.

## Phase 1 — `design-system` package (shadcn + Base UI)

1. `design-system/package.json`: `name: @operator/design-system`, `type: module`, `exports` map, deps: `react`, `react-dom`, `@base-ui-components/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tailwindcss`, `@tailwindcss/postcss`.
2. `components.json` (shadcn) configured for **Base UI**: `style: "base-ui"` (or manual), `tailwind`, `aliases`: `components: "@operator/design-system/components"`, `utils: "@operator/design-system/lib/utils"`. Run `npx shadcn@latest init` then `npx shadcn@latest add <list>` to generate the committed components inside the package.
3. Implement `lib/utils.ts` with `cn()` (`clsx` + `tailwind-merge`).
4. Add the theme/token layer: CSS variables for the existing `data-theme` values (`claw`, `knot`, `dash`) and `data-theme-mode` (`light`/`dark`), preserving the legacy `index.html` theme bootstrap logic so existing persisted settings still resolve.
5. Seed an initial component set the shell + first page need: `button`, `input`, `select` (Base UI `Select`), `dialog`, `dropdown-menu`, `tabs`, `tooltip`, `card`, `badge`, `separator`, `scroll-area`, `switch`, `checkbox`, `sheet`/`drawer`, `command` (command palette), `resizable` (or port the resizable-divider), `toast`/`sonner`.
6. Export a barrel; verify the package typechecks with `tsgo` and builds standalone.

## Phase 2 — `apps/console` scaffold (Next.js, no legacy coupling)

1. `apps/console/package.json`: `next`, `react`, `react-dom`, `@operator/design-system` (`workspace:*`), `tailwindcss`, `@tailwindcss/postcss`, `typescript`, `@types/*`. Scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
2. `next.config.mjs`: `output: "standalone"`; `async rewrites()` proxying `/api`, `/ws`, and gateway auth/avatar/assistant-media endpoints to the gateway origin (`OPERATOR_GATEWAY_URL` env, default `http://127.0.0.1:<gateway port>`). Keep the route paths the legacy app used so deep links survive.
3. `tsconfig.json` extends root; add `@/*` and `@operator/design-system` aliases; `jsx: preserve`, `moduleResolution: bundler`, `plugins: [{name:"next"}]`.
4. `globals.css`: Tailwind layers + design tokens (import from `@operator/design-system/theme`).
5. `src/app/layout.tsx`: mount `<DesignSystemProvider>`, theme provider (reads the legacy persisted settings key `operator.control.settings.v1` from `localStorage` so existing users keep their theme; keep this key until a deliberate migration), a lightweight mount-fallback (port the legacy `index.html` fallback, but as React), and `next/font` for Inter.
6. `src/lib/gateway-client.ts`: port the framework-agnostic parts of `ui/src/api/gateway.ts`, `gateway-browser-socket.ts`, `gateway-browser-auth.ts`, `event-log.ts` to a React-friendly client (uses `fetch`/WebSocket; no Lit). Keep method/type names aligned with `ui/src/api/types.ts`. Reuse `@operator/gateway-client` / `@operator/gateway-protocol` where the legacy app already does.
7. `src/lib/i18n/`: port the i18n _catalog/registry_ logic from `ui/src/i18n/lib/*` (framework-agnostic) and add thin React bindings (context + `useT()`). Do **not** import the generated Lit-dependent test helpers. The English source catalog (`ui/src/i18n/locales/en.ts`) is the source of truth — reuse it; do not fork translations.
8. `src/config/routes.ts`: a path map that mirrors `ui/src/app-route-paths.ts` (same `basePath` handling from `gateway.controlUi.basePath`).

## Phase 3 — App shell + first migrated page (prove the pattern)

Pick the lowest-risk, highest-signal page to prove the pattern end-to-end. Recommended: **`/about`** (static, no gateway state) or **`/chat`** (core, exercises client/gateway). Do both shell + one page.

1. Rebuild the shell (`app-sidebar`, `app-topbar`, `resizable-divider`, `theme-mode-toggle`, `connection-banner`, `update-banner`, `login-gate`) with `design-system` components. Preserve the `SidebarNavRoute` model from `ui/src/app-navigation.ts`.
2. Rebuild the chosen page as a Next.js route under `src/app/(console)/<route>/page.tsx`, using `design-system` Base UI components instead of Web Awesome / Lit elements. Replace every Lit element and Web Awesome component used by that page with its shadcn Base UI equivalent from `design-system`.
3. Wire data through `src/lib/gateway-client.ts` + `src/lib/i18n`.
4. Add a Playwright spec mirroring the legacy `ui/tests/**` coverage for that route (or reuse `qa/scenarios/ui/*.yaml` surfaces).

**Definition of "replace all components with shadcn Base UI":** for each migrated page, every presentational component (buttons, inputs, selects, dialogs, menus, tabs, tooltips, toggles, cards, lists, sheets) is sourced from `@operator/design-system` (shadcn Base UI), and no `@awesome.me/webawesome` or `lit` custom elements remain on that page. Feature/logic parity (data shown, actions, auth, websocket) is preserved.

## Phase 4 — Incremental page migration (repeatable playbook)

For each remaining route in `ui/src/app-routes.ts` (chat, new-session, activity, agents, channels, connection, config/*, model-providers, memory-import, profile, workboard, worktrees, sessions, usage, debug, logs, skill-workshop, skills, tasks, nodes, plugin(s), approval, cron), repeat Phase 3:

- Port logic/lib first (framework-agnostic), then build the React page with `design-system`.
- Migrate pages in dependency order: leaf/static pages before pages that depend on shared panels (channels wizard, sessions view, new-session composer).
- Keep the legacy `/ui` route serving each page until its `apps/console` counterpart passes parity (visual + Playwright + gateway integration).
- Update `qa/scenarios/ui/*.yaml` `surface`/`category` references to point at the new app as pages land, or add a parallel surface.

A page is "done" when: it renders via `apps/console`, all its components come from `design-system`, its Playwright/QA spec passes, and gateway auth/avatar/media still work through the proxy.

## Phase 5 — Serving integration (gateway proxy to Next server)

1. Add gateway config support for a Next-server-backed Console: `gateway.controlUi.mode: "next" | "static"` (default `static` to keep current behavior). When `next`, the gateway proxies the `basePath` to `OPERATOR_CONSOLE_URL` (e.g. `http://127.0.0.1:3000`) instead of reading `dist/control-ui`.
2. Reuse existing auth/scope checks (`authorizeHttpGatewayConnect`, `operator.read` scope, rate limiter, bootstrap-config path) in the proxy handler. Do **not** reimplement them.
3. Keep `src/infra/control-ui-assets.ts` `resolveControlUiRootSync` path working for `static` mode; add a `next` branch that resolves the console URL from config/env.
4. `apps/console` reads `OPERATOR_GATEWAY_URL`/base path from env (injected by gateway bootstrap or env) so client calls + websockets hit the correct origin (preserve the legacy `control-ui-config.json` contract or its `OPERATOR_GATEWAY_URL` equivalent).
5. Update `scripts/ui.js` build wrapper and `scripts/build-all.mjs` `ciArtifacts`/`PNPM_STEP_NODE_FALLBACKS` so `ui:build` still builds `/ui` until cutover, and add a parallel `console:build`/`console:dev` (or reuse `apps/console` scripts). Do not remove `ui:build` in this plan.

## Phase 6 — Cutover & cleanup (separate, gated step — out of scope for scaffold)

Only after full parity + QA green:

- Flip default `gateway.controlUi.mode` to `next`; mark `/ui` deprecated (keep one release for rollback).
- Update docs (`docs/web/control-ui.md`) and rename references from `control-ui` → `console` where user-visible; keep internal compatibility aliases.
- Remove `/ui`, its i18n scripts, `dist/control-ui` serving code, and legacy `ui:*` build steps in a follow-up PR with its own review.

## Risks

- **i18n pipeline coupling:** `scripts/control-ui-i18n.ts` hard-codes `LOCALES_DIR = <root>/ui/src/i18n/locales`, `SOURCE_LOCALE_PATH = .../en.ts`, and `I18N_ASSETS_DIR = .../ui/src/i18n/.i18n`; the verify/sync/baseline scripts and the `control-ui-i18n` CI job + locale-refresh workflow all assume those paths. Until cutover, the source of truth stays in `ui/src/i18n`. The console app must **import/reuse** that same `en.ts` catalog (via the `ui` workspace or a shared path), not fork it. Moving the catalog out of `ui/` requires updating these scripts + CI in lockstep — defer that to the Phase 6 cutover.
- **Service worker / stale-chunk reload:** legacy SW logic has no Next equivalent needed immediately; the new app can ship without SW initially (Next handles its own asset hashing). Revisit only if offline behavior is required.
- **Base path & deep links:** `gateway.controlUi.basePath` must be forwarded to the Next app (env) or deep links 404. Preserve the legacy `control-ui-config.json` namespace aliases.
- **Gateway proxy auth:** must reuse existing scope/rate-limit/CSP logic; a naive proxy that bypasses `authorizeHttpGatewayConnect` is a security regression. Keep auth in the gateway, proxy only authed traffic.
- **Workspace/build blast radius:** adding `apps/console` to auto-scanned lint/tsgo/test could break existing gates. Keep new packages opt-in until parity.
- **No shadcn Base UI precedent in repo:** confirm `npx shadcn@latest` supports the `base-ui` style in the pinned toolchain; if not, generate components manually on `@base-ui-components/react` following shadcn conventions.

## Validation

Per repo AGENTS.md, proof must be local/trusted where possible, remote (Crabbox/Testbox) for heavy/visual:

- `pnpm --filter @operator/design-system typecheck` and `build` green.
- `pnpm --filter @operator/console dev` serves the app; `build` + `start` (standalone) succeed.
- Each migrated page: `pnpm --filter @operator/console lint typecheck`, plus its Playwright spec (port `ui/tests/helpers/control-ui-e2e.ts` mount pattern or reuse the QA scenario surface).
- Gateway integration: run gateway with `gateway.controlUi.mode: "next"`, confirm auth, avatar/assistant-media, base path, and websocket proxy work; verify the legacy `dist/control-ui` `static` mode still builds via `pnpm ui:build`.
- CI lane `checks-ui` and `control-ui-i18n` must stay green through the scaffold (no `/ui` removal yet). Add a `console` lane incrementally.

## Open questions (resolve at implementation start)

1. i18n binding library: `react-i18next` vs a custom thin context around the ported registry. (Plan assumes reuse of the ported `ui/src/i18n/lib` catalog + a new React binding layer.)
2. Where Next server runs in production/docker: co-located on the gateway host vs separate container; needs the docker packaging owner's input (Phase 5 touches packaging).
3. Command palette (`command-palette`) and terminal panel (`libterminal`/`ghostty-web`) are the most complex surfaces — confirm they are in-scope for this migration or deferred to a later follow-up.
4. Version pinning vs `minimumReleaseAge: 2880` (48h) release-age gate: whether newest Next/React/Base UI versions clear the gate or need `minimumReleaseAgeExclude` entries.

## Resolved

- Package scope/name: `@operator/console` and `@operator/design-system` (repo confirmed on `@operator` published scope; internal `@operator/*` tsconfig aliases stay).
- Workspace mechanism: `pnpm-workspace.yaml` `packages:` globs (not root `package.json` `workspaces`).
