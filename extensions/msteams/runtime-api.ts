// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export type { AllowlistMatch } from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export {
  mergeAllowlist,
  resolveAllowlistMatchSimple,
  summarizeMapping,
} from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelOutboundAdapter,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { resolveToolsBySender } from "@gabrielvfonseca/operator/plugin-sdk/channel-policy";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-targets";
export type {
  GroupPolicy,
  GroupToolPolicyConfig,
  MSTeamsChannelConfig,
  MSTeamsCloudName,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
  MarkdownTableMode,
  OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export { isDangerousNameMatchingEnabled } from "@gabrielvfonseca/operator/plugin-sdk/dangerous-name-runtime";
export { resolveDefaultGroupPolicy } from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { withFileLock } from "@gabrielvfonseca/operator/plugin-sdk/file-lock";
export { keepHttpServerTaskAlive } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export {
  detectMime,
  extensionForMime,
  extractOriginalFilename,
  getFileExtension,
  resolveChannelMediaMaxBytes,
} from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { dispatchReplyFromConfigWithSettledDispatcher } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
export { buildMediaPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export type { ReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { SsrFPolicy } from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export { fetchWithSsrFGuard } from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export { normalizeStringEntries } from "@gabrielvfonseca/operator/plugin-sdk/string-normalization-runtime";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export { DEFAULT_WEBHOOK_MAX_BODY_BYTES } from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export { setMSTeamsRuntime } from "./src/runtime.js";
