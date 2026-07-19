// Telegram API module exposes the plugin public contract.
export { buildChannelConfigSchema } from "@gabrielvfonseca/operator/plugin-sdk/channel-config-schema";
export { TelegramConfigSchema } from "@gabrielvfonseca/operator/plugin-sdk/bundled-channel-config-schema";
export {
  normalizeTelegramCommandDescription,
  normalizeTelegramCommandName,
  resolveTelegramCustomCommands,
} from "./src/command-config.js";
