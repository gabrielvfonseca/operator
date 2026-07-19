---
summary: "WeChat channel setup through the external operator-weixin plugin"
read_when:
  - You want to connect Operator to WeChat or Weixin
  - You are installing or troubleshooting the operator-weixin channel plugin
  - You need to understand how external channel plugins run beside the Gateway
title: "WeChat"
---

Operator connects to WeChat through Tencent's external
`@tencent-weixin/operator-weixin` channel plugin.

Status: external plugin, maintained by the Tencent Weixin team. Direct chats and
media are supported. Group chats are not advertised by the plugin capability
metadata (it declares direct chats only).

## Naming

- **WeChat** is the user-facing name in these docs.
- **Weixin** is the name used by Tencent's package and by the plugin id.
- `operator-weixin` is the Operator channel id (`weixin` and `wechat` work as aliases).
- `@tencent-weixin/operator-weixin` is the npm package.

Use `operator-weixin` in CLI commands and config paths.

## How it works

The WeChat code does not live in the Operator core repo. Operator provides the
generic channel plugin contract, and the external plugin provides the
WeChat-specific runtime:

1. `operator plugins install` installs `@tencent-weixin/operator-weixin`.
2. The Gateway discovers the plugin manifest and loads the plugin entrypoint.
3. The plugin registers channel id `operator-weixin`.
4. `operator channels login --channel operator-weixin` starts QR login.
5. The plugin stores account credentials under the Operator state directory
   (`~/.operator` by default).
6. When the Gateway starts, the plugin starts its Weixin monitor for each
   configured account.
7. Inbound WeChat messages are normalized through the channel contract, routed to
   the selected Operator agent, and sent back through the plugin outbound path.

That separation matters: Operator core stays channel-agnostic. WeChat login,
Tencent iLink API calls, media upload/download, context tokens, and account
monitoring are owned by the external plugin.

## Install

Quick install:

```bash
npx -y @tencent-weixin/operator-weixin-cli install
```

Manual install:

```bash
operator plugins install "@tencent-weixin/operator-weixin"
operator config set plugins.entries.operator-weixin.enabled true
```

Restart the Gateway after install:

```bash
operator gateway restart
```

## Login

Run QR login on the same machine that runs the Gateway:

```bash
operator channels login --channel operator-weixin
```

Scan the QR code with WeChat on your phone and confirm the login. The plugin saves
the account token locally after a successful scan.

To add another WeChat account, run the same login command again. For multiple
accounts, isolate direct-message sessions by account, channel, and sender:

```bash
operator config set session.dmScope per-account-channel-peer
```

## Access control

Direct messages use the normal Operator pairing and allowlist model for channel
plugins.

Approve new senders:

```bash
operator pairing list operator-weixin
operator pairing approve operator-weixin <CODE>
```

For the full access-control model, see [Pairing](/channels/pairing).

## Compatibility

The plugin checks the host Operator version at startup.

| Plugin line | Operator version                                                | npm tag  |
| ----------- | --------------------------------------------------------------- | -------- |
| `2.x`       | `>=2026.5.12` (current 2.4.6; early 2.x accepted `>=2026.3.22`) | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22`                                         | `legacy` |

If the plugin reports that your Operator version is too old, either update
Operator or install the legacy plugin line:

```bash
operator plugins install @tencent-weixin/operator-weixin@legacy
```

## Sidecar process

The WeChat plugin can run helper work beside the Gateway while it monitors the
Tencent iLink API. In issue #68451, that helper path exposed a bug in Operator's
generic stale-Gateway cleanup: a child process could try to clean up the parent
Gateway process, causing restart loops under process managers such as systemd.

Current Operator startup cleanup excludes the current process and its ancestors,
so a channel helper cannot kill the Gateway that launched it. This fix is
generic; it is not a WeChat-specific path in core.

## Troubleshooting

Check install and status:

```bash
operator plugins list
operator channels status --probe
operator --version
```

If the channel shows as installed but does not connect, confirm that the plugin is
enabled and restart:

```bash
operator config set plugins.entries.operator-weixin.enabled true
operator gateway restart
```

If the Gateway restarts repeatedly after enabling WeChat, update both Operator and
the plugin:

```bash
npm view @tencent-weixin/operator-weixin version
operator plugins install "@tencent-weixin/operator-weixin" --force
operator gateway restart
```

If startup reports that the installed plugin package `requires compiled runtime
output for TypeScript entry`, the npm package was published without the compiled
JavaScript runtime files Operator needs. Update/reinstall after the plugin
publisher ships a fixed package, or temporarily disable/uninstall the plugin.

Temporary disable:

```bash
operator config set plugins.entries.operator-weixin.enabled false
operator gateway restart
```

## Related docs

- Channel overview: [Chat Channels](/channels)
- Pairing: [Pairing](/channels/pairing)
- Channel routing: [Channel Routing](/channels/channel-routing)
- Plugin architecture: [Plugin Architecture](/plugins/architecture)
- Channel plugin SDK: [Channel Plugin SDK](/plugins/sdk-channel-plugins)
- External package: [@tencent-weixin/operator-weixin](https://www.npmjs.com/package/@tencent-weixin/operator-weixin)
