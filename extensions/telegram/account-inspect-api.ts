// Telegram API module exposes the plugin public contract.
import type { OperatorConfig } from "./runtime-api.js";
import { inspectTelegramAccount } from "./src/account-inspect.js";

export function inspectTelegramReadOnlyAccount(cfg: OperatorConfig, accountId?: string | null) {
  return inspectTelegramAccount({ cfg, accountId });
}
