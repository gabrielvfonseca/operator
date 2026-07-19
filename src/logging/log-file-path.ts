// Log file path helpers resolve log output paths for local runtime logs.
import path from "node:path";
import type { OperatorConfig } from "../config/types.js";
import {
  POSIX_OPERATOR_TMP_DIR,
  resolvePreferredOperatorTmpDir,
} from "../infra/tmp-operator-dir.js";
import { canUseNodeFs, formatLocalDate, LOG_PREFIX, LOG_SUFFIX } from "./log-file-shared.js";

function resolveDefaultRollingLogFile(date = new Date()): string {
  const logDir = canUseNodeFs() ? resolvePreferredOperatorTmpDir() : POSIX_OPERATOR_TMP_DIR;
  return path.join(logDir, `${LOG_PREFIX}-${formatLocalDate(date)}${LOG_SUFFIX}`);
}

/** Resolves the configured log file or today's rolling default log path. */
export function resolveConfiguredLogFilePath(config?: OperatorConfig | null): string {
  return config?.logging?.file ?? resolveDefaultRollingLogFile();
}
