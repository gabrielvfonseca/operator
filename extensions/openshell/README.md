# @gabrielvfonseca/openshell-sandbox

Official NVIDIA OpenShell sandbox backend for Operator.

This plugin lets Operator use OpenShell-managed sandboxes with mirrored local workspaces and SSH command execution.

## Install

```bash
operator plugins install @gabrielvfonseca/openshell-sandbox
```

Restart the Gateway after installing or updating the plugin.

## Configure

Use the OpenShell docs for credentials, workspace mirroring, runtime selection, and troubleshooting:

- https://docs.operator.ai/gateway/openshell

## Package

- Plugin id: `openshell`
- Package: `@gabrielvfonseca/openshell-sandbox`
- Minimum Operator host: `2026.5.12-beta.1`
