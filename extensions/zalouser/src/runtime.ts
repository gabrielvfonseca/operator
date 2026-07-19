// Zalouser plugin module implements runtime behavior.
import type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/core";
import { createPluginRuntimeStore } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";

const { setRuntime: setZalouserRuntime, getRuntime: getZalouserRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "zalouser",
    errorMessage: "Zalouser runtime not initialized",
  });
export { getZalouserRuntime, setZalouserRuntime };
