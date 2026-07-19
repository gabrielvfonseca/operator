// Agent Workspace script supports Operator repository automation.
export function posixAgentWorkspaceScript(purpose: string): string {
  return `set -eu
workspace="\${OPERATOR_WORKSPACE_DIR:-$HOME/.operator/workspace}"
mkdir -p "$workspace/.operator"
cat > "$workspace/IDENTITY.md" <<'IDENTITY_EOF'
# Identity

- Name: Operator
- Purpose: ${purpose}
IDENTITY_EOF
cat > "$workspace/.operator/workspace-state.json" <<'STATE_EOF'
{
  "version": 1,
  "setupCompletedAt": "2026-01-01T00:00:00.000Z"
}
STATE_EOF
rm -f "$workspace/BOOTSTRAP.md"`;
}

export function windowsAgentWorkspaceScript(purpose: string): string {
  return `$workspace = $env:OPERATOR_WORKSPACE_DIR
if (-not $workspace) { $workspace = Join-Path $env:USERPROFILE '.operator\\workspace' }
$stateDir = Join-Path $workspace '.operator'
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
@'
# Identity

- Name: Operator
- Purpose: ${purpose}
'@ | Set-Content -Path (Join-Path $workspace 'IDENTITY.md') -Encoding UTF8
@'
{
  "version": 1,
  "setupCompletedAt": "2026-01-01T00:00:00.000Z"
}
'@ | Set-Content -Path (Join-Path $stateDir 'workspace-state.json') -Encoding UTF8
Remove-Item (Join-Path $workspace 'BOOTSTRAP.md') -Force -ErrorAction SilentlyContinue`;
}
