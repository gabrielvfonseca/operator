// Vitest ui config wires the ui test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";
import { jsdomOptimizedDeps } from "./vitest.shared.config.ts";

export function createUiVitestConfig(
  env?: Record<string, string | undefined>,
  options?: { includePatterns?: string[]; name?: string },
) {
  const includePatterns = options?.includePatterns ?? ["ui/tests/**/*.test.ts"];
  const exclude = options?.includePatterns ? [] : ["ui/tests/**/*.e2e.test.ts"];
  return createScopedVitestConfig(includePatterns, {
    deps: jsdomOptimizedDeps,
    environment: "jsdom",
    env,
    exclude,
    excludeUnitFastTests: false,
    includeOperatorRuntimeSetup: false,
    isolate: false,
    name: options?.name ?? "ui",
    setupFiles: ["ui/tests/helpers/lit-warnings.setup.ts"],
  });
}

export default createUiVitestConfig();
