// Matrix API module exposes the plugin public contract.
import type { OperatorPluginApi } from "@gabrielvfonseca/operator/plugin-sdk/channel-entry-contract";
import { createLazyRuntimeModule } from "@gabrielvfonseca/operator/plugin-sdk/lazy-runtime";

const loadMatrixSubagentHooksModule = createLazyRuntimeModule(
  () => import("./src/matrix/subagent-hooks.js"),
);

export function registerMatrixSubagentHooks(api: OperatorPluginApi): void {
  api.on("subagent_ended", async (event) => {
    const { handleMatrixSubagentEnded } = await loadMatrixSubagentHooksModule();
    await handleMatrixSubagentEnded(event);
  });
  api.on("subagent_delivery_target", async (event) => {
    const { handleMatrixSubagentDeliveryTarget } = await loadMatrixSubagentHooksModule();
    return handleMatrixSubagentDeliveryTarget(event);
  });
}
