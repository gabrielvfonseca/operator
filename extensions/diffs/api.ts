// Diffs API module exposes the plugin public contract.
export type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";
export {
  definePluginEntry,
  type AnyAgentTool,
  type OperatorPluginApi,
  type OperatorPluginConfigSchema,
  type OperatorPluginToolContext,
  type PluginLogger,
} from "openclaw/plugin-sdk/plugin-entry";
export { resolvePreferredOperatorTmpDir } from "openclaw/plugin-sdk/temp-path";
