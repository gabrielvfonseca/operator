// Zalo plugin module implements runtime support behavior.
export type { ReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
export type {
  OperatorConfig,
  GroupPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { MarkdownTableMode } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { BaseTokenResolution } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { SecretInput } from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export type {
  ChannelPlugin,
  PluginRuntime,
  WizardPrompter,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { OutboundReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  formatPairingApproveHint,
  jsonResult,
  normalizeAccountId,
  readStringParam,
  resolveClientIp,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  buildSingleChannelSecretPromptState,
  mergeAllowFromEntries,
  migrateBaseNameToDefaultAccount,
  promptSingleChannelSecretInput,
  runSingleChannelSecretStep,
  setTopLevelChannelDmPolicyWithAllowFrom,
} from "@gabrielvfonseca/operator/plugin-sdk/setup";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export {
  buildTokenChannelStatusSummary,
  PAIRING_APPROVED_MESSAGE,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { buildBaseAccountStatusSnapshot } from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export {
  formatAllowFromLowercase,
  isNormalizedSenderAllowed,
} from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export { addWildcardAllowFrom } from "@gabrielvfonseca/operator/plugin-sdk/setup";
export { resolveOpenProviderRuntimeGroupPolicy } from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export {
  warnMissingProviderGroupPolicyFallbackOnce,
  resolveDefaultGroupPolicy,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-feedback";
export {
  deliverTextOrMediaReply,
  isNumericTargetId,
  sendPayloadWithChunkedTextAndMedia,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "@gabrielvfonseca/operator/plugin-sdk/inbound-envelope";
export { waitForAbortSignal } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export {
  applyBasicWebhookRequestGuards,
  createFixedWindowRateLimiter,
  createWebhookAnomalyTracker,
  readJsonWebhookBodyOrReject,
  registerPluginHttpRoute,
  registerWebhookTarget,
  registerWebhookTargetWithPluginRoute,
  resolveWebhookPath,
  resolveWebhookTargetWithAuthOrRejectSync,
  WEBHOOK_ANOMALY_COUNTER_DEFAULTS,
  WEBHOOK_RATE_LIMIT_DEFAULTS,
  withResolvedWebhookRequestPipeline,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export type {
  RegisterWebhookPluginRouteOptions,
  RegisterWebhookTargetOptions,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
