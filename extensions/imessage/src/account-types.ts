// Imessage plugin module implements account types behavior.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<OperatorConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
