// Vitest utils config wires the utils test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createUtilsVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/utils/**/*.test.ts"], {
    dir: "src",
    env,
    includeOperatorRuntimeSetup: false,
    name: "utils",
    passWithNoTests: true,
  });
}

export default createUtilsVitestConfig();
