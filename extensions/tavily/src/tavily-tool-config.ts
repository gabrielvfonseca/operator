// Tavily helper module supports tavily tool config behavior.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";
import type { OperatorPluginToolContext } from "openclaw/plugin-sdk/plugin-entry";
import type { OperatorPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

export type TavilyToolConfigContext = Pick<
  OperatorPluginToolContext,
  "config" | "runtimeConfig" | "getRuntimeConfig"
>;

export function resolveTavilyToolConfig(
  api: OperatorPluginApi,
  ctx?: TavilyToolConfigContext,
): OperatorConfig {
  return ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
}
