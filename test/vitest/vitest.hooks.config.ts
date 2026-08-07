// Vitest hooks config wires the hooks test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createHooksVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/hooks/**/*.test.ts"], {
    dir: "tests/hooks",
    env,
    name: "hooks",
    passWithNoTests: true,
  });
}

export default createHooksVitestConfig();
