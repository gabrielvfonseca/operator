// Qqbot plugin module implements qqbot test support behavior.
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";

export function makeQqbotSecretRefConfig(): OperatorConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as OperatorConfig;
}

export function makeQqbotDefaultAccountConfig(): OperatorConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as OperatorConfig;
}
