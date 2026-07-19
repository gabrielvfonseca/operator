// Tlon plugin module implements runtime behavior.
import type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
import { createPluginRuntimeStore } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";

const { setRuntime: setTlonRuntime, getRuntime: getTlonRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "tlon",
    errorMessage: "Tlon runtime not initialized",
  });
export { getTlonRuntime, setTlonRuntime };
