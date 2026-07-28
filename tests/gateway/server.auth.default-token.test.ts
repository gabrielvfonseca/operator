/**
 * Gateway default auth-token tests.
 */
import { describe } from "vitest";
import { registerDefaultAuthTokenSuite } from "../../../src/gateway/server.auth.default-token.suite.js";
import { installGatewayTestHooks } from "../../src/gateway/server.auth.test-helpers.js";

installGatewayTestHooks({ scope: "suite" });

describe("gateway server auth/connect", () => {
  registerDefaultAuthTokenSuite();
});
