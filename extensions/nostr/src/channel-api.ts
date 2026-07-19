// Nostr API module exposes the plugin public contract.
export {
  buildChannelConfigSchema,
  DEFAULT_ACCOUNT_ID,
  formatPairingApproveHint,
  type ChannelPlugin,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export type { ChannelOutboundAdapter } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export {
  collectStatusIssuesFromLastError,
  createDefaultChannelRuntimeState,
} from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
