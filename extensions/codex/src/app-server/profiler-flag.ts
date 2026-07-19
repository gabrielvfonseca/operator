/**
 * Resolves whether Codex app-server profiling instrumentation is enabled by
 * Operator diagnostic flags.
 */
import type { OperatorConfig } from "@gabrielvfonseca/operator/plugin-sdk/config-contracts";
import { isDiagnosticFlagEnabled } from "@gabrielvfonseca/operator/plugin-sdk/diagnostic-runtime";

const PROFILER_FLAGS = ["profiler", "codex.profiler"] as const;

/** Checks the generic and Codex-specific profiler diagnostic flags. */
export function isCodexAppServerProfilerEnabled(
  config?: OperatorConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return PROFILER_FLAGS.some((flag) => isDiagnosticFlagEnabled(flag, config, env));
}
