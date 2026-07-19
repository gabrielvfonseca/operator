---
summary: "Uninstall Operator completely (CLI, service, state, workspace)"
read_when:
  - You want to remove Operator from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

Two paths:

- **Easy path** if `openclaw` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
operator uninstall
```

State removal preserves configured workspace directories unless you also select `--workspace`.

Preview what will be removed (safe):

```bash
operator uninstall --dry-run --all
```

Non-interactive (automation / npx). Use with caution and only after confirming scopes:

```bash
operator uninstall --all --yes --non-interactive
npx -y operator uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace`, `--app` select individual scopes; `--all` selects all four.

Manual steps (same result):

1. Stop the gateway service:

```bash
operator gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
operator gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${OPERATOR_STATE_DIR:-$HOME/.operator}"
```

If you set `OPERATOR_CONFIG_PATH` to a custom location outside the state dir, delete that file too.
If you want to keep a workspace inside the state dir, such as `~/.operator/workspace`, move it aside before running `rm -rf` or delete state contents selectively.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.operator/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/Operator.app
```

Notes:

- If you used profiles (`--profile` / `OPERATOR_PROFILE`), repeat step 3 for each state dir (defaults are `~/.operator-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `openclaw` is missing.

### macOS (launchd)

Default label is `ai.operator.gateway` (or `ai.operator.<profile>` with a profile):

```bash
launchctl bootout gui/$UID/ai.operator.gateway
rm -f ~/Library/LaunchAgents/ai.operator.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.operator.<profile>`.

### Linux (systemd user unit)

Default unit name is `operator-gateway.service` (or `operator-gateway-<profile>.service`). A pre-rename `clawdbot-gateway.service` unit may still exist on machines upgraded from very old installs; `operator uninstall` / `operator gateway uninstall` detects and removes it automatically.

```bash
systemctl --user disable --now operator-gateway.service
rm -f ~/.config/systemd/user/operator-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `Operator Gateway` (or `Operator Gateway (<profile>)`).
The task launches a windowless `gateway.vbs` script under your state dir, which in turn
runs `gateway.cmd`; remove both.

```powershell
schtasks /Delete /F /TN "Operator Gateway"
Remove-Item -Force "$env:USERPROFILE\.operator\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.operator\gateway.vbs" -ErrorAction SilentlyContinue
```

If you used a profile, delete the matching task name and the `gateway.cmd` /
`gateway.vbs` files under `~\.operator-<profile>`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://operator.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g openclaw@latest`.
Remove it with `npm rm -g openclaw` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `operator ...` / `bun run operator ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

## Related

- [Install overview](/install)
- [Migration guide](/install/migrating)
