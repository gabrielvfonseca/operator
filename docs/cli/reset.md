---
summary: "CLI reference for `operator reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "Reset"
---

# `operator reset`

Reset local config/state (keeps the CLI installed).

```bash
operator reset
operator reset --dry-run
operator reset --scope config --yes --non-interactive
operator reset --scope config+creds+sessions --yes --non-interactive
operator reset --scope full --yes --non-interactive
```

## Options

- `--scope <scope>`: `config`, `config+creds+sessions`, or `full`
- `--yes`: skip confirmation prompts
- `--non-interactive`: disable prompts; requires `--scope` and `--yes`
- `--dry-run`: print actions without removing files

## Scopes

| Scope                   | Removes                                                                                               | Stops gateway first |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------- |
| `config`                | config file only                                                                                      | no                  |
| `config+creds+sessions` | config file, OAuth/credentials dir, per-agent session directories                                     | yes                 |
| `full`                  | state dir (including config/creds if nested inside it) plus workspace dirs and workspace attestations | yes                 |

`config+creds+sessions` and `full` stop a running managed gateway service before deleting state.

## Notes

- Run `operator backup create` first for a restorable snapshot before removing local state.
- Without `--scope`, `operator reset` prompts interactively for the scope to remove.
- `--non-interactive` is only valid when both `--scope` and `--yes` are set.
- `config+creds+sessions` and `full` print `Next: operator onboard --install-daemon` when done.

## Related

- [CLI reference](/cli)
