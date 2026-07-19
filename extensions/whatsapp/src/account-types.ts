// Whatsapp plugin module implements account types behavior.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<OperatorConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
