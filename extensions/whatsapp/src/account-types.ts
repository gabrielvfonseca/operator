// Whatsapp plugin module implements account types behavior.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<OperatorConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
