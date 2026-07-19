// Private runtime barrel for the bundled Nextcloud Talk extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { AllowlistMatch } from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export type { ChannelGroupContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyConfig,
  OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-group-policy";
export { createChannelMessageReplyPipeline } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export type { OutboundReplyPayload } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export { deliverFormattedTextWithAttachments } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export type { SecretInput } from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export { fetchWithSsrFGuard } from "@gabrielvfonseca/operator/plugin-sdk/ssrf-runtime";
export { setNextcloudTalkRuntime } from "./src/runtime.js";
