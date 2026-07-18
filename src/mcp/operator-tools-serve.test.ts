// Operator MCP tools tests cover core tool server startup and registration.
import { afterEach, describe, expect, it, vi } from "vitest";
import { hashSystemAgentOperation } from "../agents/tools/system-agent-tool.js";
import {
  OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
  resolveOperatorToolsForMcp,
  resolveOperatorToolsMcpAgentSessionKey,
} from "./openclaw-tools-serve.js";
import {
  buildSystemAgentToolsMcpServerConfig,
  OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV,
  OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV,
  OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV,
  OPERATOR_TOOLS_MCP_TOOLS_ENV,
  resolveOperatorToolsMcpSystemAgentSurface,
  resolveOperatorToolsMcpToolSelection,
} from "./operator-tools-serve-config.js";
import { createPluginToolsMcpHandlers } from "./plugin-tools-handlers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Operator tools MCP server", () => {
  it("exposes cron", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveOperatorToolsForMcp({ agentSessionKey: "agent:worker:main" }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toContain("cron");
  });

  it("requires the managed bridge to pass a real agent session key", () => {
    expect(() => resolveOperatorToolsForMcp({ agentSessionKey: "" })).toThrow(
      OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
    );
  });

  it("reads the managed bridge agent session key from env", () => {
    expect(
      resolveOperatorToolsMcpAgentSessionKey({
        [OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV]: " agent:worker:main ",
      }),
    ).toBe("agent:worker:main");
  });

  it("serves the ring-zero openclaw tool without an agent session key", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveOperatorToolsForMcp({
        tools: ["@gabrielvfonseca/operator"],
        systemAgentSurface: "cli",
      }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(["@gabrielvfonseca/operator"]);
  });

  it("returns approved CLI MCP mutations to the host instead of applying them", async () => {
    const operation = { kind: "config-set", path: "gateway.port", value: "19001" } as const;
    vi.stubEnv(OPERATOR_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV, "1");
    vi.stubEnv(OPERATOR_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV, hashSystemAgentOperation(operation));
    const handlers = createPluginToolsMcpHandlers(
      resolveOperatorToolsForMcp({
        tools: ["@gabrielvfonseca/operator"],
        systemAgentSurface: "cli",
      }),
    );

    const result = await handlers.callTool({
      name: "@gabrielvfonseca/operator",
      arguments: {
        action: "config_set",
        path: "gateway.port",
        value: "19001",
        approved: true,
      },
    });

    expect(JSON.stringify(result)).toContain("directive:approved-operation:");
  });

  it("parses the served tool selection from env and defaults to cron", () => {
    expect(resolveOperatorToolsMcpToolSelection({})).toEqual(["cron"]);
    expect(
      resolveOperatorToolsMcpToolSelection({
        [OPERATOR_TOOLS_MCP_TOOLS_ENV]: " openclaw , cron ",
      }),
    ).toEqual(["@gabrielvfonseca/operator", "cron"]);
    expect(() =>
      resolveOperatorToolsMcpToolSelection({ [OPERATOR_TOOLS_MCP_TOOLS_ENV]: "exec" }),
    ).toThrow(OPERATOR_TOOLS_MCP_TOOLS_ENV);
  });

  it("parses the openclaw surface from env and defaults to cli", () => {
    expect(resolveOperatorToolsMcpSystemAgentSurface({})).toBe("cli");
    expect(
      resolveOperatorToolsMcpSystemAgentSurface({
        [OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
      }),
    ).toBe("gateway");
    expect(() =>
      resolveOperatorToolsMcpSystemAgentSurface({
        [OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "remote",
      }),
    ).toThrow(OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV);
  });

  it("builds a operator-only stdio server config under the openclaw name", () => {
    const config = buildSystemAgentToolsMcpServerConfig({ surface: "gateway" });

    expect(Object.keys(config.mcpServers)).toEqual(["@gabrielvfonseca/operator"]);
    const server = config.mcpServers.operator as {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };
    expect(server.command).toBe(process.execPath);
    expect(server.args?.at(-1)).toMatch(/openclaw-tools-serve\.(js|ts)$/);
    expect(server.env).toEqual({
      [OPERATOR_TOOLS_MCP_TOOLS_ENV]: "@gabrielvfonseca/operator",
      [OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
    });
  });
});
