//#region src/infra/node-commands.ts
const NODE_SYSTEM_RUN_COMMANDS = [
	"system.run.prepare",
	"system.run",
	"system.which"
];
const NODE_SYSTEM_NOTIFY_COMMAND = "system.notify";
const NODE_FS_LIST_DIR_COMMAND = "fs.listDir";
const NODE_TERMINAL_UPLOAD_COMMAND = "terminal.upload";
const NODE_FILE_COMMANDS = [NODE_FS_LIST_DIR_COMMAND, NODE_TERMINAL_UPLOAD_COMMAND];
const NODE_BROWSER_PROXY_COMMAND = "browser.proxy";
const NODE_MCP_TOOLS_CALL_COMMAND = "mcp.tools.call.v1";
const NODE_AGENT_CLI_CLAUDE_RUN_COMMAND = "agent.cli.claude.run.v1";
const NODE_DUPLEX_INVOKE_IDLE_TIMEOUT_MS = 3e4;
const NODE_EXEC_APPROVALS_COMMANDS = ["system.execApprovals.get", "system.execApprovals.set"];
const NODE_ADMIN_ONLY_INVOKE_COMMANDS = [
	NODE_BROWSER_PROXY_COMMAND,
	NODE_FS_LIST_DIR_COMMAND,
	NODE_TERMINAL_UPLOAD_COMMAND
];
const NODE_ADMIN_PAIR_APPROVAL_COMMANDS = [
	...NODE_SYSTEM_RUN_COMMANDS,
	...NODE_ADMIN_ONLY_INVOKE_COMMANDS,
	...NODE_EXEC_APPROVALS_COMMANDS
];
const NODE_MCP_TOOL_CALL_TIMEOUT_MS = 12e4;
const NODE_MCP_TOOL_CALL_GATEWAY_TIMEOUT_MS = 125e3;
//#endregion
Object.defineProperty(exports, "NODE_ADMIN_ONLY_INVOKE_COMMANDS", {
	enumerable: true,
	get: function() {
		return NODE_ADMIN_ONLY_INVOKE_COMMANDS;
	}
});
Object.defineProperty(exports, "NODE_ADMIN_PAIR_APPROVAL_COMMANDS", {
	enumerable: true,
	get: function() {
		return NODE_ADMIN_PAIR_APPROVAL_COMMANDS;
	}
});
Object.defineProperty(exports, "NODE_AGENT_CLI_CLAUDE_RUN_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_AGENT_CLI_CLAUDE_RUN_COMMAND;
	}
});
Object.defineProperty(exports, "NODE_BROWSER_PROXY_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_BROWSER_PROXY_COMMAND;
	}
});
Object.defineProperty(exports, "NODE_DUPLEX_INVOKE_IDLE_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return NODE_DUPLEX_INVOKE_IDLE_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "NODE_EXEC_APPROVALS_COMMANDS", {
	enumerable: true,
	get: function() {
		return NODE_EXEC_APPROVALS_COMMANDS;
	}
});
Object.defineProperty(exports, "NODE_FILE_COMMANDS", {
	enumerable: true,
	get: function() {
		return NODE_FILE_COMMANDS;
	}
});
Object.defineProperty(exports, "NODE_FS_LIST_DIR_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_FS_LIST_DIR_COMMAND;
	}
});
Object.defineProperty(exports, "NODE_MCP_TOOLS_CALL_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_MCP_TOOLS_CALL_COMMAND;
	}
});
Object.defineProperty(exports, "NODE_MCP_TOOL_CALL_GATEWAY_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return NODE_MCP_TOOL_CALL_GATEWAY_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "NODE_MCP_TOOL_CALL_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return NODE_MCP_TOOL_CALL_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "NODE_SYSTEM_NOTIFY_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_SYSTEM_NOTIFY_COMMAND;
	}
});
Object.defineProperty(exports, "NODE_SYSTEM_RUN_COMMANDS", {
	enumerable: true,
	get: function() {
		return NODE_SYSTEM_RUN_COMMANDS;
	}
});
Object.defineProperty(exports, "NODE_TERMINAL_UPLOAD_COMMAND", {
	enumerable: true,
	get: function() {
		return NODE_TERMINAL_UPLOAD_COMMAND;
	}
});
