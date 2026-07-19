// Mattermost API module exposes the plugin public contract.
export { createAccountStatusSink } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/core";
export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/core";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
