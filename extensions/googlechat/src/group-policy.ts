import {
  buildChannelGroupsScopeTree,
  resolveScopeRequireMention,
  type ScopeTree,
} from "@gabrielvfonseca/operator/plugin-sdk/channel-policy";
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/core";

type GroupContext = { cfg: OperatorConfig; accountId?: string | null; groupId?: string | null };

export function buildGoogleChatGroupPolicyScope(params: {
  tree: ScopeTree;
  groupId?: string | null;
}) {
  const matchKey =
    params.groupId && Object.hasOwn(params.tree.scopes, params.groupId)
      ? params.groupId
      : undefined;
  return { tree: params.tree, path: matchKey ? [matchKey] : [], matchKey };
}

export function resolveGoogleChatGroupRequireMention(params: GroupContext): boolean {
  return resolveScopeRequireMention(
    buildGoogleChatGroupPolicyScope({
      tree: buildChannelGroupsScopeTree(params.cfg, "googlechat", params.accountId),
      groupId: params.groupId,
    }),
  );
}
