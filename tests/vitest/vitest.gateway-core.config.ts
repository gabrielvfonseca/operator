// Vitest gateway core config wires the gateway core test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

const nonCoreGatewayTestExclude = [
  "tests/gateway/server-methods/**/*.test.ts",
  "packages/gateway-protocol/src/**/*.test.ts",
  "tests/gateway/**/*client*.test.ts",
  "tests/gateway/**/*reconnect*.test.ts",
  "tests/gateway/**/*android-node*.test.ts",
  "tests/gateway/**/*gateway-cli-backend*.test.ts",
  "tests/gateway/**/*server*.test.ts",
  "tests/gateway/gateway.test.ts",
  "tests/gateway/embeddings-http.test.ts",
  "tests/gateway/models-http.test.ts",
  "tests/gateway/openai-http.test.ts",
  "tests/gateway/openresponses-http.test.ts",
  "tests/gateway/probe.auth.integration.test.ts",
  "tests/gateway/server.startup-matrix-migration.integration.test.ts",
  "tests/gateway/sessions-history-http.test.ts",
];

export function createGatewayCoreVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/gateway/**/*.test.ts"], {
    dir: "tests/gateway",
    env,
    exclude: nonCoreGatewayTestExclude,
    // Gateway child projects share one include file; preserve this project's ownership.
    intersectIncludeFile: true,
    name: "gateway-core",
  });
}

export default createGatewayCoreVitestConfig();
