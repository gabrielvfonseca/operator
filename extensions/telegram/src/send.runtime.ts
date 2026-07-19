// Telegram plugin module implements send behavior.
export { requireRuntimeConfig } from "@gabrielvfonseca/operator/plugin-sdk/plugin-config-runtime";
export { resolveMarkdownTableMode } from "@gabrielvfonseca/operator/plugin-sdk/markdown-table-runtime";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { PollInput, MediaKind } from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export {
  buildOutboundMediaLoadOptions,
  getImageMetadata,
  isGifMedia,
  kindFromMime,
  normalizePollInput,
  probeVideoDimensions,
} from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { loadWebMedia } from "@gabrielvfonseca/operator/plugin-sdk/web-media";
