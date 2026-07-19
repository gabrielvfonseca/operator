// Whatsapp API module exposes the plugin public contract.
export { resolveIdentityNamePrefix } from "@gabrielvfonseca/operator/plugin-sdk/agent-runtime";
export { formatInboundEnvelope } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { resolveInboundSessionEnvelopeContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { toLocationContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export {
  createChannelMessageReplyPipeline,
  resolveChannelMessageSourceReplyDeliveryMode,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export {
  isControlCommandMessage,
  shouldComputeCommandAuthorized,
} from "@gabrielvfonseca/operator/plugin-sdk/command-detection";
export { resolveChannelContextVisibilityMode } from "../config.runtime.js";
export { getAgentScopedMediaLocalRoots } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export type LoadConfigFn = typeof import("../config.runtime.js").getRuntimeConfig;
export {
  buildHistoryContextFromEntries,
  type HistoryEntry,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-history";
export { resolveSendableOutboundReplyParts } from "@gabrielvfonseca/operator/plugin-sdk/reply-payload";
export {
  dispatchReplyWithBufferedBlockDispatcher,
  resolveChunkMode,
  resolveTextChunkLimit,
  type getReplyFromConfig,
  type ReplyPayload,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
export {
  resolveInboundLastRouteSessionKey,
  type resolveAgentRoute,
} from "@gabrielvfonseca/operator/plugin-sdk/routing";
export {
  logVerbose,
  shouldLogVerbose,
  type getChildLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/runtime-env";
export { resolvePinnedMainDmOwnerFromAllowlist } from "@gabrielvfonseca/operator/plugin-sdk/security-runtime";
export { resolveMarkdownTableMode } from "@gabrielvfonseca/operator/plugin-sdk/markdown-table-runtime";
export { jidToE164, normalizeE164 } from "../../text-runtime.js";
