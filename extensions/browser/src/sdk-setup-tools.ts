/**
 * Browser-local SDK setup/tooling bridge for CLI, media, and action helpers.
 */
export {
  callGatewayTool,
  listNodes,
  resolveNodeIdFromList,
  selectDefaultNodeFromList,
} from "@gabrielvfonseca/operator/plugin-sdk/agent-harness-runtime";
export type {
  AnyAgentTool,
  NodeListNode,
} from "@gabrielvfonseca/operator/plugin-sdk/agent-harness-runtime";
export {
  imageResultFromFile,
  jsonResult,
  readPositiveIntegerParam,
  readStringParam,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export {
  formatCliCommand,
  formatHelpExamples,
  inheritOptionFromParent,
  note,
  theme,
} from "@gabrielvfonseca/operator/plugin-sdk/cli-runtime";
export { danger, info } from "@gabrielvfonseca/operator/plugin-sdk/runtime-env";
export {
  IMAGE_REDUCE_QUALITY_STEPS,
  buildImageResizeSideGrid,
  getImageMetadata,
  isImageProcessorUnavailableError,
  resizeToJpeg,
} from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { detectMime } from "@gabrielvfonseca/operator/plugin-sdk/media-mime";
export {
  ensureMediaDir,
  saveMediaBuffer,
} from "@gabrielvfonseca/operator/plugin-sdk/media-runtime";
export { describeImageFile } from "@gabrielvfonseca/operator/plugin-sdk/media-understanding-runtime";
export { formatDocsLink } from "@gabrielvfonseca/operator/plugin-sdk/setup-tools";
