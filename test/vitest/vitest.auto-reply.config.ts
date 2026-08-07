// Vitest auto reply config wires the auto reply test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createAutoReplyVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/auto-reply/**/*.test.ts"], {
    dir: "tests/auto-reply",
    env,
    name: "auto-reply",
  });
}

export default createAutoReplyVitestConfig();
