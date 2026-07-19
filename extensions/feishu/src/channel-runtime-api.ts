// Feishu API module exposes the plugin public contract.
export type {
  ChannelMessageActionName,
  ChannelMeta,
  ChannelPlugin,
  ClawdbotConfig,
} from "../runtime-api.js";

export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-resolution";
export { createActionGate } from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export {
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
export { PAIRING_APPROVED_MESSAGE } from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
