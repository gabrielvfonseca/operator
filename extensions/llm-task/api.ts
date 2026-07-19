// Llm Task API module exposes the plugin public contract.
export { resolvePreferredOperatorTmpDir, withTempWorkspace } from "./src/runtime-api.js";
export {
  definePluginEntry,
  type AnyAgentTool,
  type OperatorPluginApi,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
