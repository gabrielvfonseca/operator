// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  OperatorConfig,
  OperatorPluginApi,
  PluginRuntime,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { ReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "@gabrielvfonseca/operator/plugin-sdk/models-provider-runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { createAccountStatusSink } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { buildAgentMediaPayload } from "@gabrielvfonseca/operator/plugin-sdk/agent-media-payload";
export {
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "@gabrielvfonseca/operator/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "@gabrielvfonseca/operator/plugin-sdk/models-provider-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "@gabrielvfonseca/operator/plugin-sdk/dangerous-name-runtime";
export { resolveStorePath } from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
export { formatInboundFromLabel } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
export { rawDataToString } from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-history";
export {
  normalizeAccountId,
  resolveThreadSessionKeys,
} from "@gabrielvfonseca/operator/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "@gabrielvfonseca/operator/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "@gabrielvfonseca/operator/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { normalizeProviderId } from "@gabrielvfonseca/operator/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
