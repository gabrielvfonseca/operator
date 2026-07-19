// Maintains config metadata fields written alongside user config.
import { VERSION } from "../version.js";
import type { OperatorConfig } from "./types.operator.js";

/** Metadata keys automatically stamped on config writes. */
const AUTO_MANAGED_CONFIG_META_FIELDS = {
  lastTouchedVersion: "lastTouchedVersion",
  lastTouchedAt: "lastTouchedAt",
} as const;

export const AUTO_MANAGED_CONFIG_META_PATHS = [
  ["meta", AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedVersion],
  ["meta", AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedAt],
] as const;

export function stampConfigWriteMetadata(
  cfg: OperatorConfig,
  now: string = new Date().toISOString(),
  version: string = VERSION,
): OperatorConfig {
  return {
    ...cfg,
    meta: {
      ...cfg.meta,
      [AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedVersion]: version,
      [AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedAt]: now,
    },
  };
}
