// Vitest wizard config wires the wizard test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createWizardVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/wizard/**/*.test.ts"], {
    dir: "src",
    env,
    name: "wizard",
    passWithNoTests: true,
  });
}

export default createWizardVitestConfig();
