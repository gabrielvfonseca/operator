// Vitest plugins config wires the plugins test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createPluginsVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/plugins/**/*.test.ts"], {
    dir: "tests/plugins",
    env,
    exclude: ["tests/plugins/contracts/**", "tests/plugins/loader.test.ts"],
    fileParallelism: false,
    isolate: false,
    name: "plugins",
    passWithNoTests: true,
  });
}

export default createPluginsVitestConfig();
