// Diffs API module exposes the plugin public contract.
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  definePluginEntry,
  type AnyAgentTool,
  type OperatorPluginApi,
  type OperatorPluginConfigSchema,
  type OperatorPluginToolContext,
  type PluginLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export { resolvePreferredOperatorTmpDir } from "@gabrielvfonseca/operator/plugin-sdk/temp-path";
