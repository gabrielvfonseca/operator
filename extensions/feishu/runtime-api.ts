// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  OperatorConfig,
  OperatorPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export type { OperatorConfig as ClawdbotConfig } from "@gabrielvfonseca/operator/plugin-sdk/core";
export type RuntimeEnv = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};
export type { GroupToolPolicyConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "@gabrielvfonseca/operator/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "@gabrielvfonseca/operator/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "@gabrielvfonseca/operator/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "@gabrielvfonseca/operator/plugin-sdk/channel-outbound";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "@gabrielvfonseca/operator/plugin-sdk/context-visibility-runtime";
export { getSessionEntry } from "@gabrielvfonseca/operator/plugin-sdk/session-store-runtime";
export { readJsonFileWithFallback } from "@gabrielvfonseca/operator/plugin-sdk/json-store";
export { normalizeAgentId } from "@gabrielvfonseca/operator/plugin-sdk/routing";
export { chunkTextForOutbound } from "@gabrielvfonseca/operator/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "@gabrielvfonseca/operator/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
