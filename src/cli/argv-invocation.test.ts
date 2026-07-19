// Argv invocation tests cover CLI argv normalization before command dispatch.
import { describe, expect, it } from "vitest";
import { resolveCliArgvInvocation } from "./argv-invocation.js";

describe("argv-invocation", () => {
  it("resolves root help and empty command path", () => {
    expect(resolveCliArgvInvocation(["node", "@gabrielvfonseca/operator", "--help"])).toEqual({
      argv: ["node", "@gabrielvfonseca/operator", "--help"],
      commandPath: [],
      primary: null,
      hasHelpOrVersion: true,
      isRootHelpInvocation: true,
    });
  });

  it("resolves command path and primary with root options", () => {
    expect(
      resolveCliArgvInvocation([
        "node",
        "@gabrielvfonseca/operator",
        "--profile",
        "work",
        "gateway",
        "status",
      ]),
    ).toEqual({
      argv: ["node", "@gabrielvfonseca/operator", "--profile", "work", "gateway", "status"],
      commandPath: ["gateway", "status"],
      primary: "gateway",
      hasHelpOrVersion: false,
      isRootHelpInvocation: false,
    });
  });
});
