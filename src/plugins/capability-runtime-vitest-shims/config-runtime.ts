// Config-runtime Vitest shims expose lightweight config helpers for capability runtime tests.
import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { OperatorConfig } from "../../config/types.js";

/** Vitest shim re-export for config runtime compatibility in capability tests. */
export { resolveActiveTalkProviderConfig };

/** Capability-test shim snapshot; tests inject config through direct helpers instead. */
export function getRuntimeConfigSnapshot(): OperatorConfig | null {
  return null;
}
