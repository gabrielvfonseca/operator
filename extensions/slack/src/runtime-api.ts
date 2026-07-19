// Slack API module exposes the plugin public contract.
export {
  buildComputedAccountStatusSnapshot,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromRequiredCredentialStatuses,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { buildChannelConfigSchema, SlackConfigSchema } from "../config-api.js";
export type { ChannelMessageActionContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export type {
  ChannelPlugin,
  OperatorPluginApi,
  PluginRuntime,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { SlackAccountConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
export { looksLikeSlackTargetId, normalizeSlackMessagingTarget } from "./target-parsing.js";
export { getChatChannelMeta } from "./channel-api.js";
export {
  createActionGate,
  imageResultFromFile,
  jsonResult,
  readNumberParam,
  readPositiveIntegerParam,
  readReactionParams,
  readStringParam,
  withNormalizedTimestamp,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
