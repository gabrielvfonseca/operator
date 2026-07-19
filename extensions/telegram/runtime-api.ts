// Telegram API module exposes the plugin public contract.
export type { OperatorPluginApi } from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
export type { ChannelMessageActionAdapter } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export type { TelegramApiOverride } from "./src/send.js";
export type {
  OperatorPluginService,
  OperatorPluginServiceContext,
  PluginLogger,
} from "@gabrielvfonseca/operator/plugin-sdk/plugin-entry";
import type { OperatorConfig as RuntimeOperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type { PluginRuntime } from "@gabrielvfonseca/operator/plugin-sdk/runtime-store";
export type {
  AcpRuntime,
  AcpRuntimeCapabilities,
  AcpRuntimeDoctorReport,
  AcpRuntimeEnsureInput,
  AcpRuntimeEvent,
  AcpRuntimeHandle,
  AcpRuntimeStatus,
  AcpRuntimeTurnInput,
  AcpRuntimeErrorCode,
  AcpSessionUpdateTag,
} from "@gabrielvfonseca/operator/plugin-sdk/acp-runtime";
export { AcpRuntimeError } from "@gabrielvfonseca/operator/plugin-sdk/acp-runtime";

export {
  emptyPluginConfigSchema,
  formatPairingApproveHint,
  getChatChannelMeta,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-plugin-common";
export { clearAccountEntryFields } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export { buildChannelConfigSchema, TelegramConfigSchema } from "./config-api.js";
export {
  DEFAULT_ACCOUNT_ID,
  normalizeAccountId,
} from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export {
  PAIRING_APPROVED_MESSAGE,
  buildTokenChannelStatusSummary,
  projectCredentialSnapshotFields,
  resolveConfiguredFromCredentialStatuses,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-status";
export {
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringArrayParam,
  readStringOrNumberParam,
  readStringParam,
  resolvePollMaxSelections,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export type { TelegramProbe } from "./src/probe.js";
export { auditTelegramGroupMembership, collectTelegramUnmentionedGroupIds } from "./src/audit.js";
export { resolveTelegramRuntimeGroupPolicy } from "./src/group-access.js";
export {
  buildTelegramExecApprovalPendingPayload,
  shouldSuppressTelegramExecApprovalForwardingFallback,
} from "./src/exec-approval-forwarding.js";
export { telegramMessageActions } from "./src/channel-actions.js";
export { monitorTelegramProvider } from "./src/monitor.js";
export { probeTelegram } from "./src/probe.js";
export {
  resolveTelegramFetch,
  resolveTelegramTransport,
  shouldRetryTelegramTransportFallback,
} from "./src/fetch.js";
export { makeProxyFetch } from "./src/proxy.js";
export {
  createForumTopicTelegram,
  deleteMessageTelegram,
  editForumTopicTelegram,
  editMessageReplyMarkupTelegram,
  editMessageTelegram,
  pinMessageTelegram,
  reactMessageTelegram,
  renameForumTopicTelegram,
  sendMessageTelegram,
  sendPollTelegram,
  sendStickerTelegram,
  sendTypingTelegram,
  unpinMessageTelegram,
} from "./src/send.js";
export {
  createTelegramThreadBindingManager,
  getTelegramThreadBindingManager,
  resetTelegramThreadBindingsForTests,
  setTelegramThreadBindingIdleTimeoutBySessionKey,
  setTelegramThreadBindingMaxAgeBySessionKey,
} from "./src/thread-bindings.js";
export { resolveTelegramToken } from "./src/token.js";
export { setTelegramRuntime } from "./src/runtime.js";
export type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/channel-core";
export type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
export type TelegramAccountConfig = NonNullable<
  NonNullable<RuntimeOperatorConfig["channels"]>["telegram"]
>;
export type TelegramActionConfig = NonNullable<TelegramAccountConfig["actions"]>;
export type TelegramNetworkConfig = NonNullable<TelegramAccountConfig["network"]>;
export { parseTelegramTopicConversation } from "./src/topic-conversation.js";
export { resolveTelegramPollVisibility } from "./src/poll-visibility.js";
