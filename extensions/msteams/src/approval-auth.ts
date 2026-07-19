// Msteams plugin module implements approval auth behavior.
import { createChannelApprovalAuth } from "@gabrielvfonseca/operator/plugin-sdk/approval-auth-runtime";
import { normalizeOptionalLowercaseString } from "@gabrielvfonseca/operator/plugin-sdk/string-coerce-runtime";
import type { OperatorConfig } from "../runtime-api.js";
import { normalizeMSTeamsMessagingTarget } from "./resolve-allowlist.js";

const MSTEAMS_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeMSTeamsApproverId(value: string | number): string | undefined {
  const normalized = normalizeMSTeamsMessagingTarget(String(value));
  if (!normalized?.startsWith("user:")) {
    return undefined;
  }
  const id = normalizeOptionalLowercaseString(normalized.slice("user:".length));
  if (!id) {
    return undefined;
  }
  return MSTEAMS_ID_RE.test(id) ? id : undefined;
}

function resolveMSTeamsChannelConfig(cfg: OperatorConfig) {
  return cfg.channels?.msteams;
}

export const msTeamsApprovalAuth = createChannelApprovalAuth({
  channelLabel: "Microsoft Teams",
  resolveInputs: ({ cfg }) => {
    const channel = resolveMSTeamsChannelConfig(cfg);
    return { allowFrom: channel?.allowFrom, defaultTo: channel?.defaultTo };
  },
  normalizeApprover: normalizeMSTeamsApproverId,
  normalizeSenderId: (value) => {
    const trimmed = normalizeOptionalLowercaseString(value);
    if (!trimmed) {
      return undefined;
    }
    return MSTEAMS_ID_RE.test(trimmed) ? trimmed : undefined;
  },
}).approvalAuth;
