#!/usr/bin/env bash
set -euo pipefail

export HOME=/tmp/operator-docker-selected-plugins
export OPENCLAW_STATE_DIR="$HOME/.operator"
export OPENCLAW_CONFIG_PATH="$OPENCLAW_STATE_DIR/operator.json"
export OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1

mkdir -p "$OPENCLAW_STATE_DIR"
node --input-type=module <<'NODE'
import fs from "node:fs";

const entries = Object.fromEntries(
  ["clickclack", "slack", "msteams"].map((id) => [id, { enabled: true }]),
);
fs.writeFileSync(
  process.env.OPENCLAW_CONFIG_PATH,
  `${JSON.stringify({ plugins: { entries } }, null, 2)}\n`,
  { mode: 0o600 },
);
NODE

for plugin_id in clickclack slack msteams clawrouter; do
  node /app/operator.mjs plugins inspect "$plugin_id" --runtime --json \
    >"/tmp/operator-${plugin_id}-inspect.json"
done

node /operator-e2e/assertions.mjs
