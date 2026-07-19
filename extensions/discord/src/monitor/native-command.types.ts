// Discord type declarations define plugin contracts.
import type { OperatorConfig } from "openclaw/plugin-sdk/config-contracts";
import type { CommandArgValues } from "openclaw/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<OperatorConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
