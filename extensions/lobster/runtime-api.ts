// Lobster API module exposes the plugin public contract.
export { definePluginEntry } from "@gabrielvfonseca/operator/plugin-sdk/core";
export type {
  AnyAgentTool,
  OperatorPluginApi,
  OperatorPluginToolContext,
  OperatorPluginToolFactory,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export {
  applyWindowsSpawnProgramPolicy,
  materializeWindowsSpawnProgram,
  resolveWindowsSpawnProgramCandidate,
} from "@gabrielvfonseca/operator/plugin-sdk/windows-spawn";
