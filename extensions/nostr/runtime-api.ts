// Private runtime barrel for the bundled Nostr extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export { getPluginRuntimeGatewayRequestScope } from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
