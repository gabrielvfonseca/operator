---
summary: "Run Operator in a rootless Podman container"
read_when:
  - You want a containerized gateway with Podman instead of Docker
title: "Podman"
---

Run the Operator Gateway in a rootless Podman container, managed by your current non-root user.

The model:

- Podman runs the gateway container.
- Your host `openclaw` CLI is the control plane.
- Persistent state lives on the host under `~/.operator` by default.
- Day-to-day management uses `operator --container <name> ...` instead of `sudo -u openclaw`, `podman exec`, or a separate service user.

## Prerequisites

- **Podman** in rootless mode
- **Operator CLI** installed on the host
- **Optional:** `systemd --user` if you want Quadlet-managed auto-start
- **Optional:** `sudo` only if you want `loginctl enable-linger "$(whoami)"` for boot persistence on a headless host

## Quick start

<Steps>
  <Step title="One-time setup">
    From the repo root, run `./scripts/podman/setup.sh`.

    This builds `operator:local` in your rootless Podman store (or pulls `OPERATOR_IMAGE` / `OPERATOR_PODMAN_IMAGE` if set), creates `~/.operator/operator.json` with `gateway.mode: "local"` if missing, and creates `~/.operator/.env` with a generated `OPERATOR_GATEWAY_TOKEN` if missing.

    Optional build-time env vars:

    | Var | Effect |
    | --- | --- |
    | `OPERATOR_IMAGE` / `OPERATOR_PODMAN_IMAGE` | Use an existing/pulled image instead of building `operator:local` |
    | `OPERATOR_IMAGE_APT_PACKAGES` | Install extra apt packages during image build (also accepts legacy `OPERATOR_DOCKER_APT_PACKAGES`) |
    | `OPERATOR_IMAGE_PIP_PACKAGES` | Install extra Python packages during image build; pin versions and use only package indexes you trust |
    | `OPERATOR_EXTENSIONS` | Compile/package supported selected plugins and install their runtime dependencies |
    | `OPERATOR_INSTALL_BROWSER` | Pre-install Chromium and Xvfb for browser automation (set to `1`) |

    For Quadlet-managed setup instead (Linux + systemd user services only):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Or set `OPERATOR_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Start the Gateway container">
    ```bash
    ./scripts/run-operator-podman.sh launch
    ```

    Starts the container as your current uid/gid with `--userns=keep-id` and bind-mounts your Operator state into the container.

  </Step>

  <Step title="Run onboarding inside the container">
    ```bash
    ./scripts/run-operator-podman.sh launch setup
    ```

    Then open `http://127.0.0.1:18789/` and use the token from `~/.operator/.env`.

    Model auth: use Operator-managed auth during setup (Anthropic API keys, or OpenAI Codex browser OAuth/device-code auth for Codex-backed OpenAI). The Podman launcher does not mount host CLI credential homes such as `~/.claude` or `~/.codex` into the setup or gateway container. Existing host CLI logins are same-host convenience paths only -- for container installs, keep provider auth in the mounted `~/.operator` state that setup manages.

  </Step>

  <Step title="Manage the running container from the host CLI">
    ```bash
    export OPERATOR_CONTAINER=openclaw
    ```

    Then normal `openclaw` commands run inside that container automatically:

    ```bash
    operator dashboard --no-open
    operator gateway status --deep   # includes extra service scan
    operator doctor
    operator channels login
    ```

    On macOS, Podman machine may make the browser appear non-local to the gateway. If the Control UI reports device-auth errors after launch, use the Tailscale guidance in [Podman and Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

The manual launcher reads only a small allowlist of Podman-related keys from `~/.operator/.env` and passes explicit runtime env vars to the container; it does not hand the full env file to Podman.

<a id="podman-and-tailscale"></a>

## Podman and Tailscale

For HTTPS or remote browser access, follow the main Tailscale docs.

Podman-specific notes:

- Keep the Podman publish host at `127.0.0.1`.
- Prefer host-managed `tailscale serve` over `operator gateway --tailscale serve`.
- On macOS, if local browser device-auth context is unreliable, use Tailscale access instead of ad hoc local tunnel workarounds.

See [Tailscale](/gateway/tailscale) and [Control UI](/web/control-ui).

## Systemd (Quadlet, optional)

If you ran `./scripts/podman/setup.sh --quadlet`, setup installs a Quadlet file at `~/.config/containers/systemd/operator.container`.

| Action | Command                                    |
| ------ | ------------------------------------------ |
| Start  | `systemctl --user start operator.service`  |
| Stop   | `systemctl --user stop operator.service`   |
| Status | `systemctl --user status operator.service` |
| Logs   | `journalctl --user -u operator.service -f` |

After editing the Quadlet file:

```bash
systemctl --user daemon-reload
systemctl --user restart operator.service
```

For boot persistence on SSH/headless hosts, enable lingering for your current user:

```bash
sudo loginctl enable-linger "$(whoami)"
```

The generated Quadlet service keeps a fixed, hardened default shape: `127.0.0.1` published ports (`18789` gateway, `18790` bridge), `--bind lan` inside the container, `keep-id` user namespace, `OPERATOR_NO_RESPAWN=1`, `Restart=on-failure`, and `TimeoutStartSec=300`. It reads `~/.operator/.env` as a runtime `EnvironmentFile` for values such as `OPERATOR_GATEWAY_TOKEN`, but does not consume the manual launcher's Podman-specific override allowlist. For custom publish ports, publish host, or other container-run flags, use the manual launcher instead, or edit `~/.config/containers/systemd/operator.container` directly and then reload and restart the service.

## Config, env, and storage

- **Config dir:** `~/.operator`
- **Workspace dir:** `~/.operator/workspace`
- **Token file:** `~/.operator/.env`
- **Launch helper:** `./scripts/run-operator-podman.sh`

The launch script and Quadlet bind-mount host state into the container: `OPERATOR_CONFIG_DIR` -> `/home/node/.operator`, `OPERATOR_WORKSPACE_DIR` -> `/home/node/.operator/workspace`. By default those are host directories, not anonymous container state, so `operator.json`, per-agent `auth-profiles.json`, channel/provider state, sessions, and workspace survive container replacement. Setup also seeds `gateway.controlUi.allowedOrigins` for `127.0.0.1` and `localhost` on the published gateway port so the local dashboard works with the container's non-loopback bind.

Useful env vars for the manual launcher (persist these in `~/.operator/.env`; the launcher reads that file before finalizing container/image defaults):

| Var                                        | Default          | Effect                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPERATOR_PODMAN_CONTAINER`                | `openclaw`       | Container name                         |
| `OPERATOR_PODMAN_IMAGE` / `OPERATOR_IMAGE` | `operator:local` | Image to run                           |
| `OPERATOR_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Host port mapped to container `18789`  |
| `OPERATOR_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Host port mapped to container `18790`  |
| `OPERATOR_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Host interface for published ports     |
| `OPERATOR_GATEWAY_BIND`                    | `lan`            | Gateway bind mode inside the container |
| `OPERATOR_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto`, or `host`           |

If you use a non-default `OPERATOR_CONFIG_DIR` or `OPERATOR_WORKSPACE_DIR`, set the same variables for both `./scripts/podman/setup.sh` and later `./scripts/run-operator-podman.sh launch` commands -- the repo-local launcher does not persist custom path overrides across shells.

## Upgrading images

After you rebuild or pull a new image, restart the container or Quadlet service.
On first startup for a new Operator version, the gateway runs safe state and
plugin repairs before reporting ready.

If the gateway exits instead of becoming ready, run the same image once with
`operator doctor --fix` against the same mounted state/config, then restart the
gateway normally:

```bash
OPERATOR_CONFIG_DIR="${OPERATOR_CONFIG_DIR:-$HOME/.operator}"
OPERATOR_WORKSPACE_DIR="${OPERATOR_WORKSPACE_DIR:-$OPERATOR_CONFIG_DIR/workspace}"
OPERATOR_PODMAN_IMAGE="${OPERATOR_PODMAN_IMAGE:-${OPERATOR_IMAGE:-operator:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.operator/.npm \
  -v "$OPERATOR_CONFIG_DIR:/home/node/.operator:rw" \
  -v "$OPERATOR_WORKSPACE_DIR:/home/node/.operator/workspace:rw" \
  "$OPERATOR_PODMAN_IMAGE" \
  operator doctor --fix
```

On SELinux hosts, add `,Z` to both bind mounts if Podman blocks access to the
mounted state.

## Useful commands

- **Container logs:** `podman logs -f openclaw`
- **Stop container:** `podman stop openclaw`
- **Remove container:** `podman rm -f openclaw`
- **Open dashboard URL from host CLI:** `operator dashboard --no-open`
- **Health/status via host CLI:** `operator gateway status --deep` (RPC probe + extra service scan)

## Troubleshooting

- **Permission denied (EACCES) on config or workspace:** The container runs with `--userns=keep-id` and `--user <your uid>:<your gid>` by default. Ensure the host config/workspace paths are owned by your current user.
- **Gateway start blocked (missing `gateway.mode=local`):** Ensure `~/.operator/operator.json` exists and sets `gateway.mode="local"`. `scripts/podman/setup.sh` creates this if missing.
- **Container restarts after an image update:** Run the one-off `operator doctor --fix` command in [Upgrading images](#upgrading-images), then start the gateway again.
- **Container CLI commands hit the wrong target:** Use `operator --container <name> ...` explicitly, or export `OPERATOR_CONTAINER=<name>` in your shell.
- **`operator update` fails with `--container`:** Expected. Rebuild/pull the image, then restart the container or the Quadlet service.
- **Quadlet service does not start:** Run `systemctl --user daemon-reload`, then `systemctl --user start operator.service`. On headless systems you may also need `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocks bind mounts:** Leave the default mount behavior alone; the launcher auto-adds `:Z` on Linux when SELinux is enforcing or permissive.

## Related

- [Docker](/install/docker)
- [Gateway background process](/gateway/background-process)
- [Gateway troubleshooting](/gateway/troubleshooting)
