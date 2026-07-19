// Telegram plugin module implements bot message context.session behavior.
export { buildChannelInboundEventContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export {
  readAmbientTranscriptWatermark,
  readSessionUpdatedAt,
  resolveAmbientTranscriptWatermarkKey,
  resolveStorePath,
} from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
export { recordInboundSession } from "@gabrielvfonseca/operator/plugin-sdk/conversation-runtime";
export { resolveInboundLastRouteSessionKey } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export { resolvePinnedMainDmOwnerFromAllowlist } from "@gabrielvfonseca/operator/plugin-sdk/security-runtime";
