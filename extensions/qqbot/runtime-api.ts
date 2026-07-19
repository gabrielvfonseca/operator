// Qqbot API module exposes the plugin public contract.
export type {
  ChannelPlugin,
  OperatorPluginApi,
  PluginRuntime,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type {
  OperatorPluginService,
  OperatorPluginServiceContext,
  PluginLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
