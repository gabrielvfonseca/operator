// Vitest secrets config wires the secrets test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createSecretsVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/secrets/**/*.test.ts"], {
    dir: "tests/secrets",
    env,
    name: "secrets",
    passWithNoTests: true,
  });
}

export default createSecretsVitestConfig();
