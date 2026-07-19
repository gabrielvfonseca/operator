// Discord plugin module implements draft chunking behavior.
import {
  resolveChannelDraftStreamingChunking,
  type ChannelDraftStreamingChunking,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import { DISCORD_TEXT_CHUNK_LIMIT } from "./outbound-adapter.js";

export function resolveDiscordDraftStreamingChunking(
  cfg: OperatorConfig,
  accountId?: string | null,
): ChannelDraftStreamingChunking {
  return resolveChannelDraftStreamingChunking(cfg, "discord", accountId, {
    fallbackLimit: DISCORD_TEXT_CHUNK_LIMIT,
  });
}
