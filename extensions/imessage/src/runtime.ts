// Imessage plugin module implements runtime behavior.
import type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/core";
import { createPluginRuntimeStore } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";

const {
  getRuntime: getIMessageRuntime,
  setRuntime: setIMessageRuntime,
  tryGetRuntime: getOptionalIMessageRuntime,
} = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "imessage",
  errorMessage: "iMessage runtime not initialized",
});
export { getIMessageRuntime, getOptionalIMessageRuntime, setIMessageRuntime };
