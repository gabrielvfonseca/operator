// Imessage API module exposes the plugin public contract.
import { formatTrimmedAllowFromEntries } from "@gabrielvfonseca/operator/plugin-sdk/channel-config-helpers";
import { PAIRING_APPROVED_MESSAGE } from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "@gabrielvfonseca/operator/plugin-sdk/status-helpers";
import { normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
};

export type { ChannelPlugin };
