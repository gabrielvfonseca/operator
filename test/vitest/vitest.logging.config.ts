// Vitest logging config wires the logging test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createLoggingVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/logging/**/*.test.ts"], {
    dir: "src",
    env,
    name: "logging",
    passWithNoTests: true,
  });
}

export default createLoggingVitestConfig();
