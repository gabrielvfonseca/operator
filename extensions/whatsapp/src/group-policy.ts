// Whatsapp plugin module implements group policy behavior.
import {
  buildChannelGroupsScopeTree,
  resolveScopeRequireMention,
  resolveScopeToolsPolicy,
  type GroupToolPolicyConfig,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-policy";
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";

type WhatsAppGroupContext = {
  cfg: OperatorConfig;
  accountId?: string | null;
  groupId?: string | null;
  senderId?: string | null;
  senderName?: string | null;
  senderUsername?: string | null;
  senderE164?: string | null;
};

function resolveScopePath(params: WhatsAppGroupContext) {
  return params.groupId ? [params.groupId] : [];
}

export function resolveWhatsAppGroupRequireMention(params: WhatsAppGroupContext): boolean {
  return resolveScopeRequireMention({
    tree: buildChannelGroupsScopeTree(params.cfg, "whatsapp", params.accountId),
    path: resolveScopePath(params),
  });
}

export function resolveWhatsAppGroupToolPolicy(
  params: WhatsAppGroupContext,
): GroupToolPolicyConfig | undefined {
  return resolveScopeToolsPolicy({
    ...params,
    tree: buildChannelGroupsScopeTree(params.cfg, "whatsapp", params.accountId),
    path: resolveScopePath(params),
    messageProvider: "whatsapp",
  });
}
