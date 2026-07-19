// Irc API module exposes the plugin public contract.
export { createAccountStatusSink } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export { PAIRING_APPROVED_MESSAGE } from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { buildBaseChannelStatusSummary } from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
