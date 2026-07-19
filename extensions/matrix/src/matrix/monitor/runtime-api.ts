// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export type {
  PluginRuntime,
  RuntimeLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
export type {
  BlockReplyContext,
  ReplyPayload,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-runtime";
export type {
  MarkdownTableMode,
  OperatorConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "@gabrielvfonseca/operator/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "@gabrielvfonseca/operator/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export {
  formatLocationText,
  toLocationContext,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { getAgentScopedMediaLocalRoots } from "@gabrielvfonseca/operator/plugin-sdk/agent-media-payload";
export { logInboundDrop } from "@gabrielvfonseca/operator/plugin-sdk/channel-inbound";
export { logTypingFailure } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export { buildChannelKeyCandidates } from "@gabrielvfonseca/operator/plugin-sdk/channel-targets";
