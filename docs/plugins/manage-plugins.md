---
summary: "Manage Operator plugins from the Control UI or CLI"
read_when:
  - You want to browse, install, enable, or disable plugins in the Control UI
  - You want quick plugin list, install, update, inspect, or uninstall examples
  - You want to choose a plugin install source
  - You want the right reference for publishing plugin packages
title: "Manage plugins"
sidebarTitle: "Manage plugins"
doc-schema-version: 1
---

The Control UI covers the common discovery, install, enable, and disable
workflow. The CLI adds update, uninstall, advanced configuration, and explicit
install-source controls. For its full command contract, flags, source-selection
rules, and edge cases, see [`operator plugins`](/cli/plugins).

Typical CLI workflow: find a package, install it from ClawHub, npm, git, or a
local path, let the managed Gateway auto-restart (or restart it manually), then
verify the plugin's runtime registrations.

## Use the Control UI

Open **Plugins** in the Control UI, or use `/settings/plugins` relative to the
configured Control UI base path. For example, a base path of `/openclaw` uses
`/openclaw/settings/plugins`. The page has two tabs:

- **Installed** shows the full local inventory grouped by category (channels,
  model providers, memory, tools). Each row opens a detail view; its overflow
  (`…`) menu enables or disables the plugin and, for externally installed
  plugins, offers **Remove**. The tab also lists the configured
  [MCP servers](/cli/mcp) with the same menu-driven enable, disable, and remove
  actions, editing `mcp.servers` in the Gateway configuration.
- **Discover** is the store: featured plugins included with Operator, official
  external plugins, and a curated connector shelf. Connector cards either add a
  hosted MCP server in one click (GitHub, Notion, Linear, Sentry,
  Home Assistant) or jump into a prefilled ClawHub search. Typing in the search
  box queries [ClawHub](https://clawhub.ai/plugins) inline and appends a **From
  ClawHub** section with download counts and source-verification badges.

Included plugins do not need a package install. Their menu action is **Enable**
or **Disable**. Workboard, for example, is included with Operator and disabled
by default, so choose **Enable** to turn it on. Bundled plugins cannot be
removed, only disabled.

Catalog and search access require `operator.read`. Install, enable, disable,
remove, and MCP server changes require `operator.admin`. A ClawHub install is
performed by the Gateway and preserves its trust, integrity, and plugin-install
policy checks. Enabling an installed plugin as an administrator also records
that explicit trust by adding the selected plugin to an existing restrictive
`plugins.allow` list. An explicit `plugins.deny` entry remains authoritative and
must be removed before enabling the plugin.

Installing or removing plugin code requires a Gateway restart. Enablement
changes can be applied without a restart when the installed plugin and current
Gateway runtime support it; otherwise the UI tells you a restart is required.
OAuth-backed MCP connectors still need a one-time `operator mcp login <name>`
from the CLI after they are added.

The Control UI does not install from arbitrary npm, git, or local-path sources,
update plugins, or expose rich plugin configuration. Use the CLI workflows
below for those operations.

## List and search plugins

```bash
operator plugins list
operator plugins list --enabled
operator plugins list --verbose
operator plugins list --json
operator plugins search "calendar"
```

`--json` for scripts:

```bash
operator plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` is a cold inventory check: what Operator can discover from
config, manifests, and the persisted plugin registry. It does not prove an
already-running Gateway imported the plugin runtime. JSON output includes
registry diagnostics and each plugin's `dependencyStatus` (whether declared
`dependencies`/`optionalDependencies` resolve on disk).

`plugins search` queries ClawHub for installable plugin packages and prints
an install hint (`operator plugins install clawhub:<package>`) per result.

## Enable and disable plugins

```bash
operator plugins enable <plugin-id>
operator plugins disable <plugin-id>
```

Toggles a plugin's config entry without touching installed files. Some
bundled plugins (bundled model/speech providers, the bundled browser plugin)
are enabled by default; others require `enable` after install.

## Install plugins

```bash
# Search ClawHub for plugin packages.
operator plugins search "calendar"

# Install from ClawHub.
operator plugins install clawhub:<package>
operator plugins install clawhub:<package>@1.2.3
operator plugins install clawhub:<package>@beta

# Install from npm.
operator plugins install npm:<package>
operator plugins install npm:@scope/operator-plugin@1.2.3
operator plugins install npm:@gabrielvfonseca/codex

# Install from a local npm-pack artifact.
operator plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
operator plugins install git:github.com/acme/operator-plugin@v1.0.0
operator plugins install ./my-plugin
operator plugins install --link ./my-plugin
```

Bare package specs install from npm during the launch cutover, unless the
name matches a bundled or official plugin id, in which case Operator uses
that local/official copy instead. Use `clawhub:`, `npm:`, `git:`, or
`npm-pack:` for deterministic source selection. Operator's bundled and official
catalog packages are trusted alongside ClawHub packages. New arbitrary npm,
git, local path/archive, `npm-pack:`, or marketplace sources require
`--force` in noninteractive installs after you review
and trust the source.

`--force` confirms a non-ClawHub source without prompting and overwrites an
existing install target when needed. For routine upgrades of a tracked npm,
ClawHub, or hook-pack install, use `operator plugins update` instead. With
`--link`, `--force` only confirms the source; the linked directory is not
copied or overwritten.

## Restart and inspect

A running managed Gateway with config reload enabled restarts automatically
after installing, updating, or uninstalling plugin code. If the Gateway is
unmanaged or reload is disabled, restart it yourself before checking live
runtime surfaces:

```bash
operator gateway restart
operator plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime` loads the plugin module and proves it registered runtime
surfaces (tools, hooks, services, Gateway methods, HTTP routes, plugin-owned
CLI commands). Plain `inspect` and `list` are cold manifest/config/registry
checks only.

## Update plugins

```bash
operator plugins update <plugin-id>
operator plugins update <npm-package-or-spec>
operator plugins update --all
operator plugins update <plugin-id> --dry-run
```

Passing a plugin id reuses its tracked install spec: stored dist-tags
(`@beta`) and exact pinned versions carry over to later `update <plugin-id>`
runs.

`operator plugins update --all` is the bulk maintenance path. It still
respects ordinary tracked install specs, but trusted official Operator
plugin records sync to the current official catalog target instead of
staying pinned to a stale exact official package; when `update.channel` is
`beta`, that sync prefers the beta release line. Use a targeted
`update <plugin-id>` to keep an exact or tagged official spec untouched.

For npm installs, pass an explicit package spec to switch the tracked
record:

```bash
operator plugins update @scope/operator-plugin@beta
operator plugins update @scope/operator-plugin
```

The second command moves a plugin back to the registry's default release
line when it was previously pinned to an exact version or tag.

See [`operator plugins`](/cli/plugins#update) for the exact fallback and
pinning rules.

## Uninstall plugins

```bash
operator plugins uninstall <plugin-id> --dry-run
operator plugins uninstall <plugin-id>
operator plugins uninstall <plugin-id> --keep-files
```

Uninstall removes the plugin's config entry, persisted plugin index record,
allow/deny list entries, and linked `plugins.load.paths` entries when
applicable. The managed install directory is removed unless you pass
`--keep-files`. A running managed Gateway restarts automatically when the
uninstall changes plugin source.

In Nix mode (`OPERATOR_NIX_MODE=1`), plugin install, update, uninstall,
enable, and disable are all disabled; manage those choices in the Nix source
for the install instead.

## Choose a source

| Source      | Use when                                                                    | Example                                                        |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | You want Operator-native discovery, scan summaries, versions, and hints     | `operator plugins install clawhub:<package>`                   |
| git         | You want a branch, tag, or commit from a repository                         | `operator plugins install git:github.com/<owner>/<repo>@<ref>` |
| local path  | You are developing or testing a plugin on the same machine                  | `operator plugins install --link ./my-plugin`                  |
| marketplace | You are installing a Claude-compatible marketplace plugin                   | `operator plugins install <plugin> --marketplace <source>`     |
| npm pack    | You are proving a local package artifact through npm install semantics      | `operator plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | You already ship JavaScript packages or need npm dist-tags/private registry | `operator plugins install npm:@acme/operator-plugin`           |

Managed local path installs must be plugin directories or archives. Put
standalone plugin files in `plugins.load.paths` instead of installing them
with `plugins install`.

## Publish plugins

ClawHub is the primary public discovery surface for Operator plugins. Publish
there when you want users to find plugin metadata, version history, registry
scan results, and install hints before they install.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Native npm plugins must ship a plugin manifest (`operator.plugin.json`) plus
`package.json` metadata before publishing:

```json package.json
{
  "name": "@acme/operator-plugin",
  "version": "1.0.0",
  "type": "module",
  "@gabrielvfonseca/operator": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
operator plugins install npm:@acme/operator-plugin
operator plugins install npm:@acme/operator-plugin@beta
operator plugins install npm:@acme/operator-plugin@1.0.0
```

Use these pages for the full publishing contract instead of treating this
page as the publishing reference:

- [ClawHub publishing](/clawhub/publishing) explains owners, scopes,
  releases, review, package validation, and package transfer.
- [Building plugins](/plugins/building-plugins) shows the full plugin
  package shape (including `operator.plugin.json`) and first publish
  workflow.
- [Plugin manifest](/plugins/manifest) defines native plugin manifest
  fields.

If the same package is available on both ClawHub and npm, use the explicit
`clawhub:` or `npm:` prefix to force one source.

## Related

- [Plugins](/tools/plugin) - install, configure, restart, and troubleshoot
- [`operator plugins`](/cli/plugins) - full CLI reference
- [Community plugins](/plugins/community) - public discovery and ClawHub publishing
- [ClawHub](/clawhub/cli) - registry CLI operations
- [Building plugins](/plugins/building-plugins) - create a plugin package
- [Plugin manifest](/plugins/manifest) - manifest and package metadata
