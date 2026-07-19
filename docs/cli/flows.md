---
summary: "Redirect: flow commands live under `operator tasks flow`"
read_when:
  - You encounter `operator flows` in older docs or release notes
  - You want a quick TaskFlow inspection reference
title: "Flows (redirect)"
---

# `operator tasks flow`

There is no top-level `operator flows` command. Durable TaskFlow inspection lives under `operator tasks flow`.

## Subcommands

```bash
operator tasks flow list   [--json] [--status <name>]
operator tasks flow show   <lookup> [--json]
operator tasks flow cancel <lookup>
```

| Subcommand | Description                | Arguments / options                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | List tracked TaskFlows.    | `--json` machine-readable output; `--status <name>` filter (see status values below). |
| `show`     | Show one TaskFlow.         | `<lookup>` flow id or owner key; `--json` machine-readable output.                    |
| `cancel`   | Cancel a running TaskFlow. | `<lookup>` flow id or owner key.                                                      |

`<lookup>` accepts either a flow id (returned by `list` / `show`) or the flow's owner key (the stable identifier the owning subsystem uses to track the flow).

### Status filter values

`--status` on `list` accepts one of: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Examples

```bash
operator tasks flow list
operator tasks flow list --status running
operator tasks flow list --json
operator tasks flow show flow_abc123
operator tasks flow show flow_abc123 --json
operator tasks flow cancel flow_abc123
```

For TaskFlow concepts and authoring, see [TaskFlow](/automation/taskflow). For the parent `tasks` command, see [tasks CLI reference](/cli/tasks).

## Related

- [CLI reference](/cli)
- [Automation](/automation)
- [TaskFlow](/automation/taskflow)
