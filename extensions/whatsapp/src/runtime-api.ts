import { createLazyRuntimeModule } from "@gabrielvfonseca/operator/plugin-sdk/lazy-runtime";
// Whatsapp API module exposes the plugin public contract.
export { getChatChannelMeta, type ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/core";
export { buildChannelConfigSchema, WhatsAppConfigSchema } from "../config-api.js";
export { DEFAULT_ACCOUNT_ID } from "@gabrielvfonseca/operator/plugin-sdk/account-id";
export {
  formatWhatsAppConfigAllowFromEntries,
  resolveWhatsAppConfigAllowFrom,
  resolveWhatsAppConfigDefaultTo,
} from "./config-accessors.js";
export {
  createActionGate,
  jsonResult,
  readReactionParams,
  readStringParam,
  ToolAuthorizationError,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
export { normalizeE164 } from "@gabrielvfonseca/operator/plugin-sdk/account-resolution";
export type { DmPolicy, GroupPolicy } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import type { OperatorConfig as RuntimeOperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";

export { type ChannelMessageActionName } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
export { loadOutboundMediaFromUrl } from "./outbound-media.runtime.js";
export {
  resolveWhatsAppGroupRequireMention,
  resolveWhatsAppGroupToolPolicy,
} from "./group-policy.js";
export {
  resolveWhatsAppGroupIntroHint,
  resolveWhatsAppMentionStripRegexes,
} from "./group-intro.js";
export { createWhatsAppOutboundBase } from "./outbound-base.js";
export {
  isWhatsAppGroupJid,
  isWhatsAppUserTarget,
  looksLikeWhatsAppTargetId,
  normalizeWhatsAppAllowFromEntries,
  normalizeWhatsAppMessagingTarget,
  normalizeWhatsAppTarget,
} from "./normalize-target.js";
export { resolveWhatsAppOutboundTarget } from "./resolve-outbound-target.js";
export { resolveWhatsAppReactionLevel } from "./reaction-level.js";

export type OperatorConfig = RuntimeOperatorConfig;
export type { WhatsAppAccountConfig } from "./account-types.js";

type MonitorWebChannel = typeof import("./channel.runtime.js").monitorWebChannel;

const loadChannelRuntime = createLazyRuntimeModule(() => import("./channel.runtime.js"));

export async function monitorWebChannel(
  ...args: Parameters<MonitorWebChannel>
): ReturnType<MonitorWebChannel> {
  const { monitorWebChannel: monitorWebChannelLocal } = await loadChannelRuntime();
  return await monitorWebChannelLocal(...args);
}
