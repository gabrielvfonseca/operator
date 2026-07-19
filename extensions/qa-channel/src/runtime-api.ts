// Qa Channel API module exposes the plugin public contract.
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelGatewayContext,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export {
  buildChannelConfigSchema,
  buildChannelOutboundSessionRoute,
  createChatChannelPlugin,
  defineChannelPluginEntry,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export { jsonResult, readStringParam } from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export { getChatChannelMeta } from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export {
  createComputedAccountStatusAdapter,
  createDefaultChannelRuntimeState,
} from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
export { createPluginRuntimeStore } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
