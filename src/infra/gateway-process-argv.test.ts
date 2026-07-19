// Tests gateway process argv parsing for diagnostics.
import { describe, expect, it } from "vitest";
import { isGatewayArgv, isOperatorCommandArgv, parseProcCmdline } from "./gateway-process-argv.js";

describe("parseProcCmdline", () => {
  it("splits null-delimited argv and trims empty entries", () => {
    expect(parseProcCmdline(" node \0 gateway \0\0 --port \0 18789 \0")).toEqual([
      "node",
      "gateway",
      "--port",
      "18789",
    ]);
  });

  it("keeps non-delimited single arguments and drops whitespace-only entries", () => {
    expect(parseProcCmdline(" gateway ")).toEqual(["gateway"]);
    expect(parseProcCmdline(" \0\t\0 ")).toStrictEqual([]);
  });
});

describe("isGatewayArgv", () => {
  it("requires a gateway token", () => {
    expect(isGatewayArgv(["node", "dist/index.js", "--port", "18789"])).toBe(false);
  });

  it("matches known entrypoints across slash and case variants", () => {
    expect(isGatewayArgv(["NODE", "C:\\Operator\\DIST\\ENTRY.JS", "gateway"])).toBe(true);
    expect(isGatewayArgv(["bun", "/srv/openclaw/scripts/run-node.mjs", "gateway"])).toBe(true);
    expect(isGatewayArgv(["node", "/srv/openclaw/operator.mjs", "gateway"])).toBe(true);
    expect(isGatewayArgv(["tsx", "/srv/openclaw/src/entry.ts", "gateway"])).toBe(true);
    expect(isGatewayArgv(["tsx", "/srv/openclaw/src/index.ts", "gateway"])).toBe(true);
  });

  it("matches the openclaw executable but gates the gateway binary behind the opt-in flag", () => {
    expect(isGatewayArgv(["C:\\bin\\operator.cmd", "gateway"])).toBe(true);
    expect(isGatewayArgv(["/usr/local/bin/operator-gateway", "gateway"])).toBe(false);
    expect(isGatewayArgv(["operator-gateway"])).toBe(false);
    expect(
      isGatewayArgv(["/usr/local/bin/operator-gateway", "gateway"], {
        allowGatewayBinary: true,
      }),
    ).toBe(true);
    expect(
      isGatewayArgv(["C:\\bin\\operator-gateway.EXE", "gateway"], {
        allowGatewayBinary: true,
      }),
    ).toBe(true);
    expect(isGatewayArgv(["operator-gateway"], { allowGatewayBinary: true })).toBe(true);
  });

  it("rejects unknown gateway argv even when the token is present", () => {
    expect(isGatewayArgv(["node", "/srv/openclaw/custom.js", "gateway"])).toBe(false);
    expect(isGatewayArgv(["python", "gateway", "script.py"])).toBe(false);
  });
});

describe("isOperatorCommandArgv", () => {
  it("matches doctor across source, built, and installed entrypoints", () => {
    expect(isOperatorCommandArgv(["node", "/srv/openclaw/operator.mjs", "doctor"], "doctor")).toBe(
      true,
    );
    expect(
      isOperatorCommandArgv(["NODE", "C:\\Operator\\DIST\\ENTRY.JS", "DOCTOR"], "doctor"),
    ).toBe(true);
    expect(isOperatorCommandArgv(["C:\\bin\\operator.cmd", "doctor", "--fix"], "doctor")).toBe(
      true,
    );
  });

  it("rejects other Operator commands and unrelated doctor processes", () => {
    expect(isOperatorCommandArgv(["@gabrielvfonseca/operator", "gateway"], "doctor")).toBe(false);
    expect(isOperatorCommandArgv(["python", "doctor", "worker.py"], "doctor")).toBe(false);
  });
});
