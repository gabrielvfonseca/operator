// Discord type declarations define plugin contracts.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import type { CommandArgValues } from "@gabrielvfonseca/operator/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<OperatorConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
