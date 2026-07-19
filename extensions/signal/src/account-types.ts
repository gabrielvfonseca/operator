// Signal plugin module implements account types behavior.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";

export type SignalAccountConfig = Omit<
  Exclude<NonNullable<OperatorConfig["channels"]>["signal"], undefined>,
  "accounts"
>;
