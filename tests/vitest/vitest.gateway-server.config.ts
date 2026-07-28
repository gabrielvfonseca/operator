// Vitest gateway server config wires the gateway server test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

const gatewayServerBackedHttpTests = [
  "tests/gateway/embeddings-http.test.ts",
  "tests/gateway/models-http.test.ts",
  "tests/gateway/openai-http.test.ts",
  "tests/gateway/openresponses-http.test.ts",
  "tests/gateway/probe.auth.integration.test.ts",
];

export function createGatewayServerVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(
    ["tests/gateway/**/*server*.test.ts", ...gatewayServerBackedHttpTests],
    {
      dir: "tests/gateway",
      env,
      exclude: [
        "tests/gateway/server-methods/**/*.test.ts",
        "tests/gateway/gateway.test.ts",
        "tests/gateway/server.startup-matrix-migration.integration.test.ts",
        "tests/gateway/sessions-history-http.test.ts",
      ],
      fileParallelism: false,
      // Gateway child projects share one include file; preserve this project's ownership.
      intersectIncludeFile: true,
      isolate: false,
      name: "gateway-server",
    },
  );
}

export default createGatewayServerVitestConfig();
