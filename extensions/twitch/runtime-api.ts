// Private runtime barrel for the bundled Twitch extension.
// Keep this barrel thin and aligned with the local extension surface.

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
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export type { OutboundDeliveryResult } from "@gabrielvfonseca/operator/plugin-sdk/channel-send-result";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { WizardPrompter } from "@gabrielvfonseca/operator/plugin-sdk/setup";
