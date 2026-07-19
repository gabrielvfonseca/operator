// Discord type declarations define plugin contracts.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import type { ThreadBindingManager } from "./thread-bindings.js";

type DiscordConfig = NonNullable<OperatorConfig["channels"]>["discord"];

export type DiscordCommandArgContext = {
  cfg: OperatorConfig;
  discordConfig: DiscordConfig;
  accountId: string;
  sessionPrefix: string;
  threadBindings: ThreadBindingManager;
  postApplySettleMs?: number;
};

export type DiscordModelPickerContext = DiscordCommandArgContext;

export type SafeDiscordInteractionCall = <T>(
  label: string,
  fn: () => Promise<T>,
) => Promise<T | null>;
