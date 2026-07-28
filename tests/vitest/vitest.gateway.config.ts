// Vitest gateway config wires the gateway test shard.
import { createProjectShardVitestConfig } from "./vitest.project-shard-config.ts";
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

const gatewayProjectConfigs = [
  "test/vitest/vitest.gateway-core.config.ts",
  "test/vitest/vitest.gateway-client.config.ts",
  "test/vitest/vitest.gateway-methods.config.ts",
  "test/vitest/vitest.gateway-server.config.ts",
] as const;

export function createGatewayVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(["tests/gateway/**/*.test.ts"], {
    dir: "tests/gateway",
    env,
    exclude: [
      "tests/gateway/gateway.test.ts",
      "tests/gateway/server.startup-matrix-migration.integration.test.ts",
      "tests/gateway/sessions-history-http.test.ts",
    ],
    name: "gateway",
  });
}

function createGatewayProjectShardVitestConfig() {
  return createProjectShardVitestConfig(gatewayProjectConfigs);
}

export default process.env.OPERATOR_GATEWAY_PROJECT_SHARDS === "0"
  ? createGatewayVitestConfig()
  : createGatewayProjectShardVitestConfig();
