// Discord helper module supports thread bindings behavior.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import {
  resolveThreadBindingIdleTimeoutMs,
  resolveThreadBindingMaxAgeMs,
  resolveThreadBindingsEnabled,
} from "@gabrielvfonseca/operator/plugin-sdk/conversation-runtime";
import { normalizeAccountId } from "@gabrielvfonseca/operator/plugin-sdk/routing";

export { resolveThreadBindingsEnabled };

export function resolveDiscordThreadBindingIdleTimeoutMs(params: {
  cfg: OperatorConfig;
  accountId?: string;
}): number {
  const accountId = normalizeAccountId(params.accountId);
  const root = params.cfg.channels?.discord?.threadBindings;
  const account = params.cfg.channels?.discord?.accounts?.[accountId]?.threadBindings;
  return resolveThreadBindingIdleTimeoutMs({
    channelIdleHoursRaw: account?.idleHours ?? root?.idleHours,
    sessionIdleHoursRaw: params.cfg.session?.threadBindings?.idleHours,
  });
}

export function resolveDiscordThreadBindingMaxAgeMs(params: {
  cfg: OperatorConfig;
  accountId?: string;
}): number {
  const accountId = normalizeAccountId(params.accountId);
  const root = params.cfg.channels?.discord?.threadBindings;
  const account = params.cfg.channels?.discord?.accounts?.[accountId]?.threadBindings;
  return resolveThreadBindingMaxAgeMs({
    channelMaxAgeHoursRaw: account?.maxAgeHours ?? root?.maxAgeHours,
    sessionMaxAgeHoursRaw: params.cfg.session?.threadBindings?.maxAgeHours,
  });
}
