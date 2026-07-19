import type { OperatorConfig } from "../../config/types.operator.js";
import { markReplyConfigRuntimeMode } from "./reply-config-runtime-mode.js";

export function markCompleteReplyConfig<T extends OperatorConfig>(
  config: T,
  options?: { runtimeMode?: "fast" | "full" },
): T {
  return markReplyConfigRuntimeMode(config, options?.runtimeMode ?? "fast");
}

export function withFastReplyConfig<T extends OperatorConfig>(config: T): T {
  return markCompleteReplyConfig(config);
}
