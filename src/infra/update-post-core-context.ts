import type { OpenClawConfig } from "../config/types.operator.js";

export const POST_CORE_UPDATE_SOURCE_CONFIG_PATH_ENV =
  "OPERATOR_UPDATE_POST_CORE_SOURCE_CONFIG_PATH";

export type PreUpdateConfigRestoreInput = {
  sourceConfig: OpenClawConfig;
  authoredConfig: OpenClawConfig;
};
