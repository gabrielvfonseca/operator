// Selects the resolved runtime snapshot for agent tool surfaces.
import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
  selectApplicableRuntimeConfig,
} from "../config/config.js";
import type { OperatorConfig } from "../config/types.operator.js";

export function resolveAgentRuntimeToolConfig(
  inputConfig?: OperatorConfig,
): OperatorConfig | undefined {
  const runtimeConfig = getRuntimeConfigSnapshot() ?? undefined;
  if (!runtimeConfig) {
    return inputConfig;
  }
  if (!inputConfig || inputConfig === runtimeConfig) {
    return runtimeConfig;
  }
  const runtimeSourceConfig = getRuntimeConfigSourceSnapshot() ?? undefined;
  // Without source identity, a process-global snapshot must not replace an explicit run config.
  if (!runtimeSourceConfig) {
    return inputConfig;
  }
  return selectApplicableRuntimeConfig({
    inputConfig,
    runtimeConfig,
    runtimeSourceConfig,
  });
}
