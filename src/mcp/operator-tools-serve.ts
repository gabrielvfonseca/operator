/**
 * Standalone MCP server for selected built-in Operator tools.
 *
 * Run via: node --import tsx src/mcp/operator-tools-serve.ts
 * Or: bun src/mcp/operator-tools-serve.ts
 */
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createCronTool } from "../agents/tools/cron-tool.js";
import { createSystemAgentTool } from "../agents/tools/system-agent-tool.js";
import type { SystemAgentToolOptions } from "../agents/tools/system-agent-tool.js";
import { formatErrorMessage } from "../infra/errors.js";
import {
  resolveOperatorToolsMcpSystemAgentApproval,
  resolveOperatorToolsMcpSystemAgentSurface,
  resolveOperatorToolsMcpToolSelection,
  type OperatorToolsMcpToolId,
} from "./operator-tools-serve-config.js";
import { connectToolsMcpServerToStdio, createToolsMcpServer } from "./tools-stdio-server.js";

export {
  OPERATOR_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV,
  OPERATOR_TOOLS_MCP_TOOLS_ENV,
} from "./operator-tools-serve-config.js";

export const OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV = "OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY";

export function resolveOperatorToolsMcpAgentSessionKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env[OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV]?.trim() || undefined;
}

export function resolveOperatorToolsForMcp(
  params: {
    agentSessionKey?: string;
    tools?: OperatorToolsMcpToolId[];
    systemAgentSurface?: SystemAgentToolOptions["surface"];
  } = {},
): AnyAgentTool[] {
  const selection = params.tools ?? resolveOperatorToolsMcpToolSelection();
  return selection.map((tool) => {
    if (tool === "@gabrielvfonseca/operator") {
      return createSystemAgentTool({
        surface: params.systemAgentSurface ?? resolveOperatorToolsMcpSystemAgentSurface(),
        ...resolveOperatorToolsMcpSystemAgentApproval(),
      });
    }
    const agentSessionKey = (
      params.agentSessionKey ?? resolveOperatorToolsMcpAgentSessionKey()
    )?.trim();
    if (!agentSessionKey) {
      throw new Error(`${OPERATOR_TOOLS_MCP_AGENT_SESSION_KEY_ENV} is required`);
    }
    return createCronTool({ agentSessionKey, creatorToolAllowlist: [{ name: "cron" }] });
  });
}

function createOperatorToolsMcpServer(
  params: {
    tools?: AnyAgentTool[];
  } = {},
): Server {
  const tools = params.tools ?? resolveOperatorToolsForMcp();
  return createToolsMcpServer({ name: "operator-tools", tools });
}

async function serveOperatorToolsMcp(): Promise<void> {
  const server = createOperatorToolsMcpServer();
  await connectToolsMcpServerToStdio(server);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  serveOperatorToolsMcp().catch((err: unknown) => {
    process.stderr.write(`operator-tools-serve: ${formatErrorMessage(err)}\n`);
    process.exit(1);
  });
}
