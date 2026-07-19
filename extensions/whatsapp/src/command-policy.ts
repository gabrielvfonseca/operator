// Whatsapp plugin module implements command policy behavior.
import type { ChannelPlugin } from "@gabrielvfonseca/operator/plugin-sdk/core";

export const whatsappCommandPolicy: NonNullable<ChannelPlugin["commands"]> = {
  enforceOwnerForCommands: true,
  preferSenderE164ForCommands: true,
  skipWhenConfigEmpty: true,
};
