// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export { buildChannelConfigSchema, GoogleChatConfigSchema } from "./config-api.js";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export { missingTargetError } from "@gabrielvfonseca/operator/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { PAIRING_APPROVED_MESSAGE } from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "@gabrielvfonseca/operator/plugin-sdk/dangerous-name-runtime";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export type {
  GoogleChatAccountConfig,
  GoogleChatConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export { extractToolSend } from "@gabrielvfonseca/operator/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "@gabrielvfonseca/operator/plugin-sdk/inbound-envelope";
export { resolveWebhookPath } from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
