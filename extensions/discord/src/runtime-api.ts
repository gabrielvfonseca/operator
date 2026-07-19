// Discord API module exposes the plugin public contract.
export {
  buildComputedAccountStatusSnapshot,
  buildTokenChannelStatusSummary,
  PAIRING_APPROVED_MESSAGE,
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { buildChannelConfigSchema, DiscordConfigSchema } from "../config-api.js";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMessageActionName,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type {
  ChannelPlugin,
  OperatorPluginApi,
  PluginRuntime,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export type {
  DiscordAccountConfig,
  DiscordActionConfig,
  DiscordConfig,
  OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  jsonResult,
  readNonNegativeIntegerParam,
  readNumberParam,
  readPositiveIntegerParam,
  readStringArrayParam,
  readStringParam,
  resolvePollMaxSelections,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export type { ActionGate } from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export { readBooleanParam } from "@gabrielvfonseca/operator/plugin-sdk/boolean-param";
export {
  assertMediaNotDataUrl,
  parseAvailableTags,
  readReactionParams,
  withNormalizedTimestamp,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export {
  createHybridChannelConfigAdapter,
  createScopedChannelConfigAdapter,
  createScopedAccountConfigAccessors,
  createScopedChannelConfigBase,
  createTopLevelChannelConfigAdapter,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-config-helpers";
export {
  createAccountActionGate,
  createAccountListHelpers,
} from "@gabrielvfonseca/operator/plugin-sdk/account-helpers";
export {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
} from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export { loadOutboundMediaFromUrl } from "@gabrielvfonseca/operator/plugin-sdk/outbound-media";
export { resolveAccountEntry } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export { getChatChannelMeta } from "./channel-api.js";
export { resolveDiscordOutboundSessionRoute } from "./outbound-session-route.js";
