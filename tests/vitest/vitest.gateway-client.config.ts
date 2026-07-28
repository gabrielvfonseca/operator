// Vitest gateway client config wires the gateway client test shard.
import { createScopedVitestConfig } from "./vitest.scoped-config.ts";

export function createGatewayClientVitestConfig(env?: Record<string, string | undefined>) {
  return createScopedVitestConfig(
    [
      "packages/gateway-client/src/**/*.test.ts",
      "packages/gateway-protocol/src/**/*.test.ts",
      "tests/gateway/**/*client*.test.ts",
      "tests/gateway/**/*reconnect*.test.ts",
      "tests/gateway/**/*android-node*.test.ts",
      "tests/gateway/**/*gateway-cli-backend*.test.ts",
    ],
    {
      env,
      exclude: ["tests/gateway/**/*server*.test.ts"],
      // Gateway child projects share one include file; preserve this project's ownership.
      intersectIncludeFile: true,
      isolate: true,
      name: "gateway-client",
    },
  );
}

export default createGatewayClientVitestConfig();
