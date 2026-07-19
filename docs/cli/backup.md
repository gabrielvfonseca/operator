---
summary: "CLI reference for `operator backup` (archives and SQLite snapshots)"
read_when:
  - You want a first-class backup archive for local Operator state
  - You need a compact, verified snapshot of one Operator SQLite database
  - You want to preview which paths would be included before reset or uninstall
title: "Backup"
---

# `operator backup`

Create a local backup archive for Operator state, config, auth profiles, channel/provider credentials, sessions, and optionally workspaces.

```bash
operator backup create
operator backup create --output ~/Backups
operator backup create --dry-run --json
operator backup create --verify
operator backup create --no-include-workspace
operator backup create --only-config
operator backup verify ./2026-03-09T08-00-00.000+08-00-operator-backup.tar.gz
operator backup sqlite create --global --repository ~/Backups/operator-sqlite
operator backup sqlite create --agent main --repository ~/Backups/operator-sqlite
operator backup sqlite list --repository ~/Backups/operator-sqlite
operator backup sqlite verify ~/Backups/operator-sqlite/<snapshot-id>
operator backup sqlite verify ~/Backups/operator-sqlite/<snapshot-id> --scratch ~/Private/operator-scratch
operator backup sqlite restore ~/Backups/operator-sqlite/<snapshot-id> --target ./restored/operator.sqlite
```

## Notes

- The archive embeds a `manifest.json` with the resolved source paths and archive layout.
- Default output is a timestamped `.tar.gz` archive in the current working directory. Timestamped filenames use your machine's local timezone and include the UTC offset. If the current working directory is inside a backed-up source tree, Operator falls back to your home directory for the default archive location.
- Existing archive files are never overwritten. Output paths inside the source state/workspace trees are rejected to avoid self-inclusion.
- `operator backup verify <archive>` checks that the archive contains exactly one root manifest, rejects traversal-style archive paths and SQLite sidecars, confirms every manifest-declared payload exists, validates every SQLite snapshot's file shape, and runs full integrity and role checks on canonical Operator databases. Dedicated plugin schemas remain opaque because they may require owner-defined SQLite capabilities. `operator backup create --verify` runs that validation immediately after writing the archive.
- `operator backup create --only-config` backs up just the active JSON config file.

## SQLite snapshots

Use `operator backup sqlite` when you need a portable artifact for one Operator-owned SQLite database instead of a broad state archive.

Snapshot creation accepts exactly one named source:

| Command                                                         | Database               |
| --------------------------------------------------------------- | ---------------------- |
| `operator backup sqlite create --global --repository <dir>`     | Shared Operator state  |
| `operator backup sqlite create --agent <id> --repository <dir>` | One per-agent database |

The repository contains one directory per committed snapshot. Each snapshot directory contains exactly:

- `manifest.json`
- `database.sqlite`

Snapshot creation verifies the live database before reading it, uses SQLite `VACUUM INTO` to capture committed WAL state into a compact database, verifies the generated database again, and publishes the completed directory without overwriting existing paths. Global snapshots remove transient delivery queue rows and compact again so deleted queue payloads are not retained in free pages.

Do not copy live `.sqlite`, `-wal`, `-shm`, or `-journal` files as a portability artifact. Copy only completed snapshot directories.

SQLite snapshots can contain auth profiles, session state, plugin state, and other sensitive records. Protect repositories with the same permissions, encryption, retention policy, and destination restrictions as the live Operator state directory.

### Verify and restore

```bash
operator backup sqlite verify <snapshot-directory>
operator backup sqlite restore <snapshot-directory> --target <new-database-path>
```

Verification checks the strict manifest shape, artifact size and SHA-256, SQLite integrity, foreign keys, schema version, database role and owner, and Operator-owned index definitions.

Verification validates a private content-pinned copy so pathname races cannot swap the bytes SQLite inspects. By default, that temporary copy is created beside the snapshot repository and removed before the command returns. The staging root and its ancestor chain must prevent other users from replacing it. POSIX roots must be current-user-owned and not group/world writable; sticky ancestors such as `/tmp` are accepted for user-owned children. macOS ACL grants that expose or make staging replaceable are rejected. Windows roots and ancestors must be owned by the current user or a trusted OS principal, with ACLs that deny untrusted staging access. For a read-only mount or network share, pass `--scratch <existing-private-directory>` on storage with equivalent encryption and destination controls.

Snapshot creation applies the same owner, ACL, ancestor, and path-identity checks to the repository before staging or publishing database bytes.

Restore repeats verification and writes only to a fresh target. It refuses an existing target, `-wal`, `-shm`, or `-journal` sidecar and never performs an in-place replacement of a live Operator database. The target parent has the same path-security requirements as verification scratch. Activating a restored database remains an explicit offline operator step.

Snapshot repositories are local directories. Scheduling, upload, retention, incremental WAL bundles, failover, and restore-on-boot behavior are intentionally outside this command.

## What gets backed up

`operator backup create` plans sources from your local Operator install:

- The state directory (usually `~/.operator`)
- The active config file path
- The resolved `credentials/` directory when it exists outside the state directory
- Workspace directories discovered from the current config, unless you pass `--no-include-workspace`

Auth profiles and other per-agent runtime state live in SQLite under the state directory (`agents/<agentId>/agent/operator-agent.sqlite`), so they are covered by the state backup entry automatically.

`--only-config` skips state, credentials-directory, and workspace discovery and archives only the active config file path.

Operator canonicalizes paths before building the archive: if config, the credentials directory, or a workspace already live inside the state directory, they are not duplicated as separate top-level backup sources. Missing paths are skipped.

During archive creation, Operator excludes known live-mutation paths before `tar` reads them. This avoids races between a file's recorded size and concurrent writes. The filter applies these state-relative rules under each backed-up state directory:

| State-relative scope                         | Skipped file suffixes         |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`, `.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`, `.log`              |
| `cron/runs/**`                               | `.jsonl`, `.log`              |
| `logs/**`                                    | `.jsonl`, `.log`              |
| `delivery-queue/**`                          | `.json`, `.delivered`, `.tmp` |
| `session-delivery-queue/**`                  | `.json`, `.delivered`, `.tmp` |
| Any path under the backed-up state directory | `.sock`, `.pid`, `.tmp`       |

These rules do not filter workspace files outside the state directory. They also omit completed transcript and log files that match the table, so retain those records separately when needed. The JSON result's `skippedVolatileCount` reports how many files were intentionally omitted.

SQLite databases under the state directory are compacted with `VACUUM INTO` so deleted-page remnants do not enter the archive, and live WAL/SHM files are not copied. A plugin-owned database that requires unavailable owner-defined SQLite capabilities fails closed rather than falling back to a raw page copy. SQLite files included through workspace backups are copied as workspace files and are not covered by the compaction guarantee.

Installed plugin source and manifest files under the state directory's `extensions/` tree are included, but their nested `node_modules/` dependency trees are skipped as rebuildable install artifacts. After restoring an archive, use `operator plugins update <id>` or reinstall with `operator plugins install <spec> --force` if a restored plugin reports missing dependencies.

## Invalid config behavior

`operator backup` bypasses the normal config preflight so it can still help during recovery. Workspace discovery depends on a valid config, so `operator backup create` fails fast when the config file exists but is invalid and workspace backup is still enabled.

For a partial backup in that situation, rerun with `--no-include-workspace`: it keeps state, config, and the external credentials directory in scope while skipping workspace discovery entirely.

`--only-config` also works when the config is malformed, since it does not parse the config for workspace discovery.

## Size and performance

Operator does not enforce a built-in maximum backup size or per-file size limit. Practical limits come from:

- Available space for the temporary archive write plus the final archive
- Time to walk large workspace trees and compress them into a `.tar.gz`
- Time to rescan the archive with `--verify` or `operator backup verify`
- Destination filesystem behavior: Operator prefers a no-overwrite hard-link publish step and falls back to exclusive copy when hard links are unsupported

Large workspaces are usually the main driver of archive size. Use `--no-include-workspace` for a smaller/faster backup, or `--only-config` for the smallest archive.

## Related

- [CLI reference](/cli)
