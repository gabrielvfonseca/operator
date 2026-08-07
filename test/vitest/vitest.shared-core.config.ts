// Vitest shared core config wires the shared core test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createSharedCoreVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/shared/**/*.test.ts"], {
    dir: "src",
    env,
    includeOperatorRuntimeSetup: false,
    name: "shared-core",
    passWithNoTests: true,
  });
}

export default createSharedCoreVitestConfig();
