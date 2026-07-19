# @gabrielvfonseca/acpx

Official ACP runtime backend for Operator.

ACPx lets Operator run external coding harnesses through the Agent Client Protocol while Operator still owns sessions, channels, delivery, permissions, and Gateway state.

## Install

```bash
operator plugins install @gabrielvfonseca/acpx
```

Restart the Gateway after installing or updating the plugin.

## What it provides

- ACP-backed agent runtime sessions.
- Plugin-owned session and transport management.
- MCP bridge helpers for Operator tools and plugin tools.
- Static runtime assets used by the ACP process bridge.

## Configure

Use the ACP docs for harness-specific setup, permission modes, and model/runtime selection:

- https://docs.operator.ai/tools/acp-agents-setup
- https://docs.operator.ai/tools/acp-agents

## Package

- Plugin id: `acpx`
- Package: `@gabrielvfonseca/acpx`
- Minimum Operator host: `2026.4.25`
