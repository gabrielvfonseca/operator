// Tavily helper module supports tavily tool config behavior.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import type { OperatorPluginToolContext } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import type { OperatorPluginApi } from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";

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
