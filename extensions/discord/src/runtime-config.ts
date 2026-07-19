// Discord helper module supports runtime config behavior.
import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
  selectApplicableRuntimeConfig,
} from "openclaw/plugin-sdk/runtime-config-snapshot";
import type { OperatorConfig } from "./runtime-api.js";

export function selectDiscordRuntimeConfig(inputConfig: OperatorConfig): OperatorConfig {
  return (
    selectApplicableRuntimeConfig({
      inputConfig,
      runtimeConfig: getRuntimeConfigSnapshot(),
      runtimeSourceConfig: getRuntimeConfigSourceSnapshot(),
    }) ?? inputConfig
  );
}
