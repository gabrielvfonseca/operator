// Telegram Mini App registerFull entrypoint.
import type { OperatorPluginApi } from "openclaw/plugin-sdk/plugin-entry";
import { registerTelegramMiniAppCommand } from "./src/miniapp/command.js";
import { registerTelegramMiniAppRoutes } from "./src/miniapp/routes.js";

export function registerTelegramMiniApp(api: OperatorPluginApi): void {
  registerTelegramMiniAppRoutes(api);
  registerTelegramMiniAppCommand(api);
}
