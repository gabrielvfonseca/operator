// Vitest unit src config wires the unit src test shard.
import { createUnitVitestConfigWithOptions } from "./vitest.unit.config.ts";

export default createUnitVitestConfigWithOptions(process.env, {
  name: "unit-src",
  includePatterns: ["tests/**/*.test.ts"],
  extraExcludePatterns: ["tests/acp/**", "tests/security/**"],
});
