// Vitest acp config wires the acp test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createAcpVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/acp/**/*.test.ts"], {
    dir: "tests/acp",
    env,
    name: "acp",
  });
}

export default createAcpVitestConfig();
