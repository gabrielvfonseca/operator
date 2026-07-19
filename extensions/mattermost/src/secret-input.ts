// Mattermost plugin module implements secret input behavior.
export type { SecretInput } from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
  normalizeSecretInputString,
} from "@gabrielvfonseca/operator/plugin-sdk/secret-input";
