---
summary: "CLI reference for `operator setup` (system-agent chat with onboarding fallback)"
read_when:
  - You want to chat with Operator for setup or repair
  - You're doing first-run setup with the onboarding wizard
  - You want to set the default workspace path
  - You need the baseline-only setup flag for scripts
title: "Setup"
---

# `operator setup`

`operator setup` is the system-agent entry point. On a configured system, bare
`operator setup` opens an interactive Operator chat. On a fresh system, it
falls through to guided onboarding. Use `-m`/`--message` for one request or
`--baseline` to initialize config/workspace folders without the wizard.

Routing order:

1. Any onboarding option (`--wizard`, `--baseline`, workspace, reset,
   non-interactive, flow, mode, Gateway, daemon, skip, import, remote, or auth
   options) runs onboarding exactly as `operator onboard` does.
2. `-m`/`--message` or `--yes` runs the system agent.
3. With no routing option, a configured interactive system opens Operator. A
   fresh system runs onboarding. On a configured system, `--json` prints the
   system overview even without a TTY; an onboarding option keeps onboarding's
   JSON summary.

In guided mode, `--workspace <dir>` is the workspace proposed to Operator;
it is persisted only after you approve that proposal. Baseline, classic, and
noninteractive setup persist the supplied workspace through their normal flow.

Guided inference detection runs on the Gateway host on macOS or Linux. The CLI
and macOS app call the same Gateway-owned detector, which checks configured
models, supported CLI logins, API-key environment variables, and already
installed Ollama or LM Studio models. Local models are never downloaded by this
automatic pass; the selected candidate must answer a real completion before its
provider and model configuration is saved.

`setup` accepts the same onboarding flags as `operator onboard`, including
auth (`--auth-choice`, `--token`, provider key flags), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), reset (`--reset`, `--reset-scope`), flow
(`--flow quickstart|advanced|manual|import`), and skip flags
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). See [Onboard](/cli/onboard) and
[CLI automation](/start/wizard-cli-automation) for the full flag reference and
non-interactive examples. `operator onboard --modern` remains a compatibility
entry for the same inference-gated Operator assistant.

<Note>
`operator setup` is for mutable config installs. In Nix mode (`OPERATOR_NIX_MODE=1`) Operator refuses setup writes because the config file is managed by Nix. Use the first-party [nix-operator Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) or the equivalent source config for another Nix package.
</Note>

## Options

| Flag                       | Description                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Run one Operator request.                                                                             |
| `--yes`                    | Approve persistent config writes for one `--message` request.                                         |
| `--workspace <dir>`        | Workspace proposal in guided mode; persisted directly by baseline, classic, and noninteractive setup. |
| `--baseline`               | Create baseline config/workspace/session folders without onboarding.                                  |
| `--wizard`                 | Force interactive onboarding.                                                                         |
| `--non-interactive`        | Run onboarding without prompts.                                                                       |
| `--accept-risk`            | Acknowledge full-system agent access risk; required with `--non-interactive`.                         |
| `--mode <mode>`            | Onboarding mode: `local` or `remote`.                                                                 |
| `--flow <flow>`            | Onboard flow: `quickstart`, `advanced`, `manual`, or `import`.                                        |
| `--reset`                  | Reset config + credentials + sessions before onboarding (workspace only with `--reset-scope full`).   |
| `--reset-scope <scope>`    | Reset scope: `config`, `config+creds+sessions`, or `full`.                                            |
| `--import-from <provider>` | Migration provider to run during onboarding.                                                          |
| `--import-source <path>`   | Source agent home for `--import-from`.                                                                |
| `--import-secrets`         | Import supported secrets during onboarding migration.                                                 |
| `--remote-url <url>`       | Remote Gateway WebSocket URL.                                                                         |
| `--remote-token <token>`   | Remote Gateway token (optional).                                                                      |
| `--json`                   | Configured system: Operator overview. Onboarding route: onboarding summary.                           |

`--classic` and `--non-interactive` are mutually exclusive: classic opens the
prompted wizard, while noninteractive setup uses the automation path.

### Baseline mode

`operator setup --baseline` preserves the older baseline-only behavior: it
creates the config, workspace, and session directories, then exits without
running onboarding.

## Examples

```bash
operator setup
operator setup -m "status"
operator setup -m "restart gateway" --yes
operator setup --json
operator setup --wizard
operator setup --baseline
operator setup --workspace ~/.operator/workspace
operator setup --import-from hermes --import-source ~/.hermes
operator setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Notes

- After baseline setup, run `operator onboard` for the full guided journey, `operator configure` for targeted changes, or `operator channels add` to add channel accounts.
- If Hermes state is detected, interactive onboarding can offer migration automatically. Import onboarding requires a fresh setup; use [Migrate](/cli/migrate) for dry-run plans, backups, and overwrite mode outside onboarding.

## Related

- [CLI reference](/cli)
- [Onboard](/cli/onboard)
- [Onboarding (CLI)](/start/wizard)
- [Getting started](/start/getting-started)
- [Install overview](/install)
