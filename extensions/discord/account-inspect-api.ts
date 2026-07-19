// Discord API module exposes the plugin public contract.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: OperatorConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
