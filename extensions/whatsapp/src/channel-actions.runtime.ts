// Whatsapp plugin module implements channel actions behavior.
import { createActionGate } from "@gabrielvfonseca/operator/plugin-sdk/channel-actions";
import type { ChannelMessageActionName } from "@gabrielvfonseca/operator/plugin-sdk/channel-contract";
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";

export { listWhatsAppAccountIds, resolveWhatsAppAccount } from "./accounts.js";
export { resolveWhatsAppReactionLevel } from "./reaction-level.js";
export { createActionGate, type ChannelMessageActionName, type OperatorConfig };
