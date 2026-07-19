---
summary: "CLI reference for `operator dns` (wide-area discovery helpers)"
read_when:
  - You want wide-area discovery (DNS-SD) via Tailscale + CoreDNS
  - You're setting up split DNS for a custom discovery domain (example: operator.internal)
title: "DNS"
---

# `operator dns`

DNS helpers for wide-area discovery (Tailscale + CoreDNS). Currently macOS + Homebrew CoreDNS only.

Related:

- Gateway discovery: [Discovery](/gateway/discovery)
- Wide-area discovery config: [Configuration](/gateway/configuration)

## `dns setup`

Plan or apply CoreDNS setup for unicast DNS-SD discovery.

```bash
operator dns setup
operator dns setup --domain operator.internal
operator dns setup --apply
```

| Option              | Effect                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | Wide-area discovery domain (for example `operator.internal`).                       |
| `--apply`           | Install/update CoreDNS config and (re)start the service. Requires sudo, macOS only. |

Without `--domain`, Operator uses `discovery.wideArea.domain` from config.

Without `--apply`, the command only prints:

- Resolved discovery domain and zone file path
- Current tailnet IPs
- Recommended `operator.json` discovery config
- Tailscale Split DNS nameserver/domain values to set in the Tailscale admin console

With `--apply` (macOS only, requires Homebrew CoreDNS):

- Bootstraps the zone file if missing
- Adds the CoreDNS import stanza if missing
- Restarts the `coredns` brew service

## Related

- [CLI reference](/cli)
- [Discovery](/gateway/discovery)
