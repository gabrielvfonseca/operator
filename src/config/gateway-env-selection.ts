import { collectConfigRuntimeEnvVars } from "./env-vars.js";
import type { OperatorConfig } from "./types.js";

export const GATEWAY_CONFIG_SELECTION_ENV_KEYS: ReadonlySet<string> = new Set([
  "ANDROID_DATA",
  "HOME",
  "HOMEDRIVE",
  "HOMEPATH",
  "OPERATOR_AGENT_DIR",
  "OPERATOR_CONFIG_PATH",
  "OPERATOR_HOME",
  "OPERATOR_INCLUDE_ROOTS",
  "OPERATOR_NIX_MODE",
  "OPERATOR_OAUTH_DIR",
  "OPERATOR_PACKAGE_DIR",
  "OPERATOR_PROFILE",
  "OPERATOR_STATE_DIR",
  "OPERATOR_TEST_FAST",
  "OPERATOR_WORKSPACE_DIR",
  "PI_CODING_AGENT_DIR",
  "PREFIX",
  "USERPROFILE",
]);

/** Rejects config.env changes that would retarget a running Gateway process. */
export function assertGatewayConfigEnvSelectionUnchanged(
  previousConfig: OperatorConfig,
  nextConfig: OperatorConfig,
): void {
  const normalize = (config: OperatorConfig) =>
    new Map(
      Object.entries(collectConfigRuntimeEnvVars(config)).map(([key, value]) => [
        key.toUpperCase(),
        value,
      ]),
    );
  const previous = normalize(previousConfig);
  const next = normalize(nextConfig);
  for (const key of GATEWAY_CONFIG_SELECTION_ENV_KEYS) {
    if (previous.get(key) !== next.get(key)) {
      throw new Error(
        `Config env cannot change process-stable Gateway selector ${key} during reload. Restart with the target environment instead.`,
      );
    }
  }
}
