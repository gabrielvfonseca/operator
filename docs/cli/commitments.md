---
summary: "CLI reference for `operator commitments` (inspect and dismiss inferred follow-ups)"
read_when:
  - You want to inspect inferred follow-up commitments
  - You want to dismiss pending check-ins
  - You are auditing what heartbeat may deliver
title: "`operator commitments`"
---

List and manage inferred follow-up commitments.

Commitments are opt-in (`commitments.enabled`), short-lived follow-up memories
created from conversation context and delivered by heartbeat. See
[Inferred commitments](/concepts/commitments) for the conceptual guide and config.

With no subcommand, `operator commitments` lists pending commitments.

## Usage

```bash
operator commitments [--all] [--agent <id>] [--status <status>] [--json]
operator commitments list [--all] [--agent <id>] [--status <status>] [--json]
operator commitments dismiss <id...> [--json]
```

## Options

- `--all`: show all statuses instead of only pending commitments.
- `--agent <id>`: filter to one agent id.
- `--status <status>`: filter by status. Values: `pending`, `sent`,
  `dismissed`, `snoozed`, or `expired`. Unknown values exit with an error.
- `--json`: output machine-readable JSON.

`dismiss` marks the given commitment ids as `dismissed` so heartbeat will not
deliver them.

## Examples

List pending commitments:

```bash
operator commitments
```

List every stored commitment:

```bash
operator commitments --all
```

Filter to one agent:

```bash
operator commitments --agent main
```

Find snoozed commitments:

```bash
operator commitments --status snoozed
```

Dismiss one or more commitments:

```bash
operator commitments dismiss cm_abc123 cm_def456
```

Export as JSON:

```bash
operator commitments --all --json
```

## Output

Text output prints the commitment count, the shared SQLite database path, any active filters,
and one row per commitment:

- commitment id
- status
- kind (`event_check_in`, `deadline_check`, `care_check_in`, or `open_loop`)
- earliest due time
- scope (agent/channel/target)
- suggested check-in text

JSON output includes the count, the active status and agent filters, the
shared SQLite database path, and the full stored records.

## Related

- [Inferred commitments](/concepts/commitments)
- [Memory overview](/concepts/memory)
- [Heartbeat](/gateway/heartbeat)
- [Scheduled tasks](/automation/cron-jobs)
