/**
 * Operator-owned tool registration filters.
 *
 * Keeps optional tool gating separate from tool construction so config and execution contracts decide exposure.
 */
import { uniqueStrings } from "@gabrielvfonseca/normalization-core/string-normalization";
import type { OperatorConfig } from "../config/types.operator.js";
import { isToolAllowedByPolicyName } from "./tool-policy-match.js";
import type { AnyAgentTool } from "./tools/common.js";

/**
 * Registration helpers for optional Operator-owned tools.
 *
 * This keeps model/runtime gating separate from tool construction so callers can
 * assemble candidate tools first, then filter by config and execution contract.
 */
/** Drops disabled optional tools while preserving candidate order. */
export function collectPresentOperatorTools(
  candidates: readonly (AnyAgentTool | null | undefined)[],
): AnyAgentTool[] {
  return candidates.filter((tool): tool is AnyAgentTool => tool !== null && tool !== undefined);
}

/** Resolves the default-on update_plan switch with an explicit kill switch. */
function isUpdatePlanToolEnabledForOperatorTools(params: {
  config?: OperatorConfig;
  agentSessionKey?: string;
  agentId?: string | null;
  modelProvider?: string;
  modelId?: string;
}): boolean {
  return params.config?.tools?.experimental?.planTool !== false;
}

/** Decides whether update_plan should be included in the assembled Operator tool set. */
export function shouldIncludeUpdatePlanToolForOperatorTools(params: {
  config?: OperatorConfig;
  agentSessionKey?: string;
  agentId?: string | null;
  modelProvider?: string;
  modelId?: string;
  pluginToolAllowlist?: string[];
  pluginToolDenylist?: string[];
}): boolean {
  const deny = uniqueStrings([
    ...(params.config?.tools?.deny ?? []),
    ...(params.pluginToolDenylist ?? []),
  ]);
  return (
    isUpdatePlanToolEnabledForOperatorTools(params) &&
    isToolAllowedByPolicyName("update_plan", { deny })
  );
}
