# @gabrielvfonseca/tokenjuice

Official Tokenjuice output compaction plugin for Operator.

Tokenjuice compacts noisy `exec` and `bash` tool results after commands run, before the result is fed back into the active agent session. It does not rewrite commands, rerun commands, or change exit codes.

## Install

```bash
operator plugins install @gabrielvfonseca/tokenjuice
```

Restart the Gateway after installing or updating the plugin.

## Enable

```bash
operator config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
operator plugins enable tokenjuice
```

## Docs

- https://docs.operator.ai/tools/tokenjuice

## Package

- Plugin id: `tokenjuice`
- Package: `@gabrielvfonseca/tokenjuice`
- Minimum Operator host: `2026.5.28`
