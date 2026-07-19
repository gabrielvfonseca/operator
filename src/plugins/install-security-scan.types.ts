// Defines plugin install security scan result types.
import type { OperatorConfig } from "../config/types.operator.js";

/** Overrides that intentionally loosen install safety policy for trusted/operator paths. */
export type InstallSafetyOverrides = {
  config?: OperatorConfig;
  dangerouslyForceUnsafeInstall?: boolean;
  trustedSourceLinkedOfficialInstall?: boolean;
};
