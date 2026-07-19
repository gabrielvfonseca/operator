// Slack API module exposes the plugin public contract.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: OperatorConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
