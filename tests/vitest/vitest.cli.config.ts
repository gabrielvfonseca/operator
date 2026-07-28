// Vitest cli config wires the cli test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createCliVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/cli/**/*.test.ts"], {
    dir: "tests/cli",
    env,
    name: "cli",
    passWithNoTests: true,
  });
}

export default createCliVitestConfig();
