---
summary: "CLI reference for `operator clawbot` (legacy alias namespace)"
read_when:
  - You maintain older scripts using `operator clawbot ...`
  - You need migration guidance to current commands
title: "Clawbot"
---

# `operator clawbot`

Legacy alias namespace kept for backward compatibility. It registers the same QR command as the top-level CLI, so `operator clawbot qr` accepts every [`operator qr`](/cli/qr) flag.

## Migration

Prefer the modern top-level command:

- `operator clawbot qr` -> `operator qr`

## Related

- [CLI reference](/cli)
