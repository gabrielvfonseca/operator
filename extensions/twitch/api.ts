// Twitch API module exposes the plugin public contract.
export type {
  ChannelAccountSnapshot,
  ChannelCapabilities,
  ChannelGatewayContext,
  ChannelLogSink,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelPlugin,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
  OperatorConfig,
  OutboundDeliveryResult,
  RuntimeEnv,
  WizardPrompter,
} from "./runtime-api.js";
export { twitchPlugin } from "./src/plugin.js";
export { setTwitchRuntime } from "./src/runtime.js";
