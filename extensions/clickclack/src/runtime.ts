/**
 * Runtime store for host-provided Operator services used by the ClickClack
 * bundled plugin.
 */
import { createPluginRuntimeStore } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
import type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";

const { setRuntime: setClickClackRuntime, getRuntime: getClickClackRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "clickclack",
    errorMessage: "ClickClack runtime not initialized",
  });

export { getClickClackRuntime, setClickClackRuntime };
