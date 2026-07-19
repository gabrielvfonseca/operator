// Matrix API module exposes the plugin public contract.
export {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
  normalizeOptionalAccountId,
} from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringArrayParam,
  readStringParam,
  ToolAuthorizationError,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "@gabrielvfonseca/operator/plugin-sdk/channel-config-schema";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
  ChannelMessageToolDiscovery,
  ChannelOutboundAdapter,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelToolSend,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export {
  formatLocationText,
  toLocationContext,
  type NormalizedLocation,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { resolveAckReaction } from "@gabrielvfonseca/operator/plugin-sdk/channel-feedback";
export type { ChannelSetupInput } from "@gabrielvfonseca/operator/plugin-sdk/setup";
export type {
  OperatorConfig,
  ContextVisibilityMode,
  DmPolicy,
  GroupPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { GroupToolPolicyConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { WizardPrompter } from "@gabrielvfonseca/operator/plugin-sdk/setup";
export type { SecretInput } from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export {
  addWildcardAllowFrom,
  formatDocsLink,
  hasConfiguredSecretInput,
  mergeAllowFromEntries,
  moveSingleAccountChannelSectionToDefaultAccount,
  promptAccountId,
  promptChannelAccessConfig,
  splitSetupEntries,
} from "@gabrielvfonseca/operator/plugin-sdk/setup";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export {
  assertHttpUrlTargetsPrivateNetwork,
  closeDispatcher,
  createPinnedDispatcher,
  isPrivateOrLoopbackHost,
  resolvePinnedHostnameWithPolicy,
  ssrfPolicyFromDangerouslyAllowPrivateNetwork,
  type LookupFn,
  type SsrFPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export { dispatchReplyFromConfigWithSettledDispatcher } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export {
  ensureConfiguredAcpBindingReady,
  resolveConfiguredAcpBindingRecord,
} from "@gabrielvfonseca/operator/plugin-sdk/acp-binding-runtime";
export {
  buildProbeChannelStatusSummary,
  collectStatusIssuesFromLastError,
  PAIRING_APPROVED_MESSAGE,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export {
  getSessionBindingService,
  resolveThreadBindingIdleTimeoutMsForChannel,
  resolveThreadBindingMaxAgeMsForChannel,
} from "@gabrielvfonseca/operator/plugin-sdk/conversation-runtime";
export { resolveOutboundSendDep } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { resolveAgentIdFromSessionKey } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
export {
  normalizePollInput,
  type PollInput,
} from "@gabrielvfonseca/operator/plugin-sdk/poll-runtime";
export { writeJsonFileAtomically } from "@gabrielvfonseca/operator/plugin-sdk/json-store";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-targets";
export { buildTimeoutAbortSignal } from "./matrix/sdk/timeout-abort-signal.js";
export { formatZonedTimestamp } from "@gabrielvfonseca/operator/plugin-sdk/time-runtime";
export type {
  PluginRuntime,
  RuntimeLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
export type { ReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
// resolveMatrixAccountStringValues already comes from the Matrix API barrel.
// Re-exporting auth-precedence here makes TS source loaders define the export twice.
