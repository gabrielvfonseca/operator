// Mattermost API module exposes the plugin public contract.
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChatType,
  HistoryEntry,
  OperatorConfig,
  OperatorPluginApi,
  ReplyPayload,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export { buildAgentMediaPayload } from "@gabrielvfonseca/operator/plugin-sdk/agent-media-payload";
export { resolveAllowlistMatchSimple } from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-feedback";
export { listSkillCommandsForAgents } from "@gabrielvfonseca/operator/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "@gabrielvfonseca/operator/plugin-sdk/models-provider-runtime";
export { isDangerousNameMatchingEnabled } from "@gabrielvfonseca/operator/plugin-sdk/dangerous-name-runtime";
export {
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { resolveChannelMediaMaxBytes } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-history";
export { registerPluginHttpRoute } from "@gabrielvfonseca/operator/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export { isTrustedProxyAddress, resolveClientIp } from "@gabrielvfonseca/operator/plugin-sdk/core";
export { parseTcpPort } from "@gabrielvfonseca/operator/plugin-sdk/number-runtime";
