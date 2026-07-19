import type { OperatorConfig } from "../../config/types.operator.js";

// Reply completeness is process-local metadata. Keep it off config objects so
// frozen runtime snapshots and identity-keyed caches remain valid.
const replyConfigRuntimeModes = new WeakMap<OperatorConfig, "fast" | "full">();

export function markReplyConfigRuntimeMode<T extends OperatorConfig>(
  config: T,
  runtimeMode: "fast" | "full",
): T {
  replyConfigRuntimeModes.set(config, runtimeMode);
  return config;
}

export function isCompleteReplyConfig(config: unknown): config is OperatorConfig {
  return Boolean(
    config && typeof config === "object" && replyConfigRuntimeModes.has(config as OperatorConfig),
  );
}

export function usesFullReplyRuntime(config: unknown): boolean {
  return Boolean(
    config &&
    typeof config === "object" &&
    replyConfigRuntimeModes.get(config as OperatorConfig) === "full",
  );
}
