/**
 * Gateway auth mode matrix tests.
 */
import { describe } from "vitest";
import { registerAuthModesSuite } from "../../../src/gateway/server.auth.modes.suite.js";
import { installGatewayTestHooks } from "../../src/gateway/server.auth.test-helpers.js";

installGatewayTestHooks({ scope: "suite" });

describe("gateway server auth/connect", () => {
  registerAuthModesSuite();
});
