// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { OutboundReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "@gabrielvfonseca/operator/plugin-sdk/channel-config-schema";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { resolveControlCommandGate } from "@gabrielvfonseca/operator/plugin-sdk/command-auth-native";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "@gabrielvfonseca/operator/plugin-sdk/dangerous-name-runtime";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
