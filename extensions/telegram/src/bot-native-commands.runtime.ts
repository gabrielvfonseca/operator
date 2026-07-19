// Telegram plugin module implements bot native commands behavior.
export {
  ensureConfiguredBindingRouteReady,
  recordInboundSessionMetaSafe,
} from "@gabrielvfonseca/operator/plugin-sdk/conversation-runtime";
export { getAgentScopedMediaLocalRoots } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export {
  executePluginCommand,
  getPluginCommandSpecs,
  matchPluginCommand,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-runtime";
export {
  finalizeInboundContext,
  resolveChunkMode,
} from "@gabrielvfonseca/operator/plugin-sdk/reply-dispatch-runtime";
export { resolveThreadSessionKeys } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export { getSessionEntry } from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
