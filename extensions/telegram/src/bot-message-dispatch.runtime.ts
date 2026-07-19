// Telegram plugin module implements bot message dispatch behavior.
export {
  getSessionEntry,
  type SessionEntry,
} from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
export { resolveMarkdownTableMode } from "@gabrielvfonseca/operator/plugin-sdk/markdown-table-runtime";
export { getAgentScopedMediaLocalRoots } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { resolveChunkMode } from "@gabrielvfonseca/operator/plugin-sdk/reply-dispatch-runtime";
export {
  generateTelegramTopicLabel as generateTopicLabel,
  resolveAutoTopicLabelConfig,
} from "./auto-topic-label.js";
