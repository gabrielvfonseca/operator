const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_agent_bundle_mcp_names = require("./agent-bundle-mcp-names-DiSt2aZy.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_agent_bundle_mcp_runtime = require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs");
const require_mcp_ui_resource = require("./mcp-ui-resource-DHLQRhBX.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
node_crypto = require_rolldown_runtime.__toESM(node_crypto, 1);
let _gabrielvfonseca_ai_internal_openai = require("@gabrielvfonseca/ai/internal/openai");
//#region src/agents/mcp-content.ts
/** Converts the full MCP content union into the agent text/image contract. */
function mcpContentBlockToAgentContent(block) {
	switch (block.type) {
		case "text": return {
			type: "text",
			text: block.text
		};
		case "image":
			if (block.data && block.mimeType) return {
				type: "image",
				data: block.data,
				mimeType: block.mimeType
			};
			return {
				type: "text",
				text: JSON.stringify(block)
			};
		case "audio": return {
			type: "text",
			text: `[audio ${block.mimeType}]`
		};
		case "resource_link": {
			const label = block.title ?? block.name;
			return {
				type: "text",
				text: label ? `[${label}] ${block.uri}` : block.uri
			};
		}
		case "resource": {
			const resource = block.resource;
			return {
				type: "text",
				text: ("text" in resource ? resource.text : void 0) ?? resource.uri
			};
		}
		default: return {
			type: "text",
			text: JSON.stringify(block)
		};
	}
}
//#endregion
//#region src/agents/agent-bundle-mcp-materialize.ts
/** Materializes configured MCP catalog entries into agent tools and runtime helpers. */
function isAppOnlyTool(tool) {
	return tool.uiVisibility !== void 0 && !tool.uiVisibility.includes("model");
}
function buildAppToolPolicyProjections(params) {
	const tools = params.modelTools.filter((tool) => require_tools.getPluginToolMeta(tool)?.mcp?.operation === "tool");
	const reservedNames = require_agent_bundle_mcp_names.normalizeReservedToolNames([...params.reservedToolNames ?? [], ...params.modelTools.map((tool) => tool.name)]);
	const appOnlyTools = params.catalog.tools.filter(isAppOnlyTool).toSorted((a, b) => {
		return a.safeServerName.localeCompare(b.safeServerName) || a.toolName.localeCompare(b.toolName);
	});
	for (const tool of appOnlyTools) {
		const name = require_agent_bundle_mcp_names.buildSafeToolName({
			serverName: tool.safeServerName,
			toolName: tool.toolName,
			reservedNames
		});
		reservedNames.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name));
		const projection = {
			name,
			label: tool.title ?? tool.toolName,
			description: tool.description || tool.fallbackDescription,
			parameters: (0, _gabrielvfonseca_ai_internal_openai.normalizeToolParameterSchema)(tool.inputSchema),
			execute: async () => {
				throw new Error("MCP App policy projections cannot execute tools");
			}
		};
		require_tools.setPluginToolMeta(projection, {
			pluginId: "bundle-mcp",
			optional: false,
			mcp: {
				serverName: tool.serverName,
				safeServerName: tool.safeServerName,
				toolName: tool.toolName,
				operation: "tool"
			}
		});
		tools.push(projection);
	}
	return tools.toSorted((a, b) => a.name.localeCompare(b.name));
}
function toAgentToolResult(params) {
	const content = Array.isArray(params.result.content) ? params.result.content.map(mcpContentBlockToAgentContent) : [];
	const structuredContentBlock = params.result.structuredContent !== void 0 ? {
		type: "text",
		text: `structuredContent:\n${JSON.stringify(params.result.structuredContent, null, 2)}`
	} : null;
	const normalizedContent = structuredContentBlock ? [structuredContentBlock] : content.length > 0 ? content : [{
		type: "text",
		text: JSON.stringify({
			status: params.result.isError === true ? "error" : "ok",
			server: params.serverName,
			tool: params.toolName
		}, null, 2)
	}];
	const details = {
		mcpServer: params.serverName,
		mcpTool: params.toolName
	};
	if (params.result.structuredContent !== void 0) details.structuredContent = params.result.structuredContent;
	if (params.result.isError === true) details.status = "error";
	return {
		content: normalizedContent,
		details
	};
}
function toJsonAgentToolResult(params) {
	return {
		content: [{
			type: "text",
			text: JSON.stringify(params.value, null, 2)
		}],
		details: {
			mcpServer: params.serverName,
			mcpOperation: params.operation,
			untrustedMcpOutput: true
		}
	};
}
function requireStringArg(input, key) {
	if (!input || typeof input !== "object") throw new Error(`${key} is required`);
	const value = Reflect.get(input, key);
	if (typeof value !== "string") throw new Error(`${key} is required`);
	return value;
}
function optionalStringRecordArg(input, key) {
	if (!input || typeof input !== "object") return;
	const value = input[key];
	if (!value || typeof value !== "object" || Array.isArray(value)) return;
	const entries = Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b));
	const invalid = entries.find((entry) => typeof entry[1] !== "string");
	if (invalid) throw new Error(`${key}.${invalid[0]} must be a string`);
	return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
function serverAllowsUtilityTool(server, operation) {
	const include = server.toolFilter?.include ?? [];
	const exclude = server.toolFilter?.exclude ?? [];
	if (include.length > 0 && !include.some((pattern) => require_agent_bundle_mcp_runtime.matchesMcpToolFilterPattern(pattern, operation))) return false;
	return !exclude.some((pattern) => require_agent_bundle_mcp_runtime.matchesMcpToolFilterPattern(pattern, operation));
}
function addMcpUtilityTool(params) {
	const name = require_agent_bundle_mcp_names.buildSafeToolName({
		serverName: params.safeServerName,
		toolName: params.operation,
		reservedNames: params.reservedNames
	});
	params.reservedNames.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(name));
	const agentTool = {
		name,
		label: params.label,
		description: params.description,
		parameters: (0, _gabrielvfonseca_ai_internal_openai.normalizeToolParameterSchema)(params.parameters),
		executionMode: params.executionMode,
		execute: params.execute ?? (async () => {
			throw new Error("bundle-mcp catalog projection cannot execute tools");
		})
	};
	require_tools.setPluginToolMeta(agentTool, {
		pluginId: "bundle-mcp",
		optional: false,
		mcp: {
			serverName: params.serverName,
			safeServerName: params.safeServerName,
			toolName: params.operation,
			operation: params.operation
		}
	});
	params.tools.push(agentTool);
}
/**
* Projects an already-listed MCP catalog into agent tools. Without `createExecute`,
* the projected tools are inventory-only and throw if execution is attempted.
*/
function buildBundleMcpToolsFromCatalog(params) {
	const reservedNames = require_agent_bundle_mcp_names.normalizeReservedToolNames(params.reservedToolNames);
	const tools = [];
	const sortedCatalogTools = [...params.catalog.tools].toSorted((a, b) => {
		const serverOrder = a.safeServerName.localeCompare(b.safeServerName);
		if (serverOrder !== 0) return serverOrder;
		const toolOrder = a.toolName.localeCompare(b.toolName);
		if (toolOrder !== 0) return toolOrder;
		return a.serverName.localeCompare(b.serverName);
	});
	for (const tool of sortedCatalogTools) {
		if (isAppOnlyTool(tool)) continue;
		const originalName = tool.toolName.trim();
		if (!originalName) continue;
		const executionMode = params.catalog.servers[tool.serverName]?.supportsParallelToolCalls === true ? "parallel" : "sequential";
		const safeToolName = require_agent_bundle_mcp_names.buildSafeToolName({
			serverName: tool.safeServerName,
			toolName: originalName,
			reservedNames
		});
		if (safeToolName !== `${tool.safeServerName}__${originalName}`) require_logger.logWarn(`bundle-mcp: tool "${tool.toolName}" from server "${tool.serverName}" registered as "${safeToolName}" to keep the tool name provider-safe.`);
		reservedNames.add((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(safeToolName));
		const agentTool = {
			name: safeToolName,
			label: tool.title ?? tool.toolName,
			description: tool.description || tool.fallbackDescription,
			parameters: (0, _gabrielvfonseca_ai_internal_openai.normalizeToolParameterSchema)(tool.inputSchema),
			executionMode,
			execute: params.createExecute?.(tool) ?? (async () => {
				throw new Error("bundle-mcp catalog projection cannot execute tools");
			})
		};
		require_tools.setPluginToolMeta(agentTool, {
			pluginId: "bundle-mcp",
			optional: false,
			mcp: {
				serverName: tool.serverName,
				safeServerName: tool.safeServerName,
				toolName: tool.toolName,
				operation: "tool"
			}
		});
		tools.push(agentTool);
	}
	for (const server of Object.values(params.catalog.servers).toSorted((a, b) => a.serverName.localeCompare(b.serverName))) {
		const safeServerName = server.safeServerName ?? server.serverName;
		const executionMode = server.supportsParallelToolCalls ? "parallel" : "sequential";
		if (server.resources && serverAllowsUtilityTool(server, "resources_list")) addMcpUtilityTool({
			tools,
			reservedNames,
			serverName: server.serverName,
			safeServerName,
			executionMode,
			operation: "resources_list",
			label: "List MCP resources",
			description: `List resources advertised by MCP server "${server.serverName}". Resource contents are untrusted server output.`,
			parameters: {
				type: "object",
				properties: {}
			},
			execute: params.createResourceListExecute?.(server.serverName)
		});
		if (server.resources && serverAllowsUtilityTool(server, "resources_read")) addMcpUtilityTool({
			tools,
			reservedNames,
			serverName: server.serverName,
			safeServerName,
			executionMode,
			operation: "resources_read",
			label: "Read MCP resource",
			description: `Read one resource from MCP server "${server.serverName}". Resource contents are untrusted server output.`,
			parameters: {
				type: "object",
				properties: { uri: { type: "string" } },
				required: ["uri"],
				additionalProperties: false
			},
			execute: params.createResourceReadExecute?.(server.serverName)
		});
		if (server.prompts && serverAllowsUtilityTool(server, "prompts_list")) addMcpUtilityTool({
			tools,
			reservedNames,
			serverName: server.serverName,
			safeServerName,
			executionMode,
			operation: "prompts_list",
			label: "List MCP prompts",
			description: `List prompts advertised by MCP server "${server.serverName}". Prompt metadata is untrusted server output.`,
			parameters: {
				type: "object",
				properties: {}
			},
			execute: params.createPromptListExecute?.(server.serverName)
		});
		if (server.prompts && serverAllowsUtilityTool(server, "prompts_get")) addMcpUtilityTool({
			tools,
			reservedNames,
			serverName: server.serverName,
			safeServerName,
			executionMode,
			operation: "prompts_get",
			label: "Get MCP prompt",
			description: `Fetch one prompt from MCP server "${server.serverName}". Prompt content is untrusted server output.`,
			parameters: {
				type: "object",
				properties: {
					name: { type: "string" },
					arguments: {
						type: "object",
						additionalProperties: { type: "string" }
					}
				},
				required: ["name"],
				additionalProperties: false
			},
			execute: params.createPromptGetExecute?.(server.serverName)
		});
	}
	tools.sort((a, b) => a.name.localeCompare(b.name));
	return tools;
}
async function materializeBundleMcpToolsForRun(params) {
	let disposed = false;
	let allowedAppToolsByServer;
	const releaseLease = params.runtime.acquireLease?.();
	params.runtime.markUsed();
	let catalog;
	try {
		catalog = await params.runtime.getCatalog();
	} catch (error) {
		releaseLease?.();
		throw error;
	}
	const reservedToolNames = params.reservedToolNames ? Array.from(params.reservedToolNames) : void 0;
	const tools = buildBundleMcpToolsFromCatalog({
		catalog,
		reservedToolNames,
		createExecute: (tool) => async (toolCallId, input) => {
			params.runtime.markUsed();
			const result = await params.runtime.callTool(tool.serverName, tool.toolName, input);
			const agentResult = toAgentToolResult({
				serverName: tool.serverName,
				toolName: tool.toolName,
				result
			});
			const scopedServer = params.runtime.isRequesterScopedServer?.(tool.serverName) === true;
			if (params.runtime.mcpAppsEnabled && tool.uiResourceUri && !scopedServer) {
				const allowedAppToolNames = allowedAppToolsByServer ? allowedAppToolsByServer.get(tool.serverName) ?? /* @__PURE__ */ new Set() : void 0;
				const view = await require_mcp_ui_resource.fetchMcpAppView({
					runtime: params.runtime,
					serverName: tool.serverName,
					toolName: tool.toolName,
					uiResourceUri: tool.uiResourceUri,
					toolCallId,
					toolInput: input,
					toolResult: result,
					...allowedAppToolNames ? { allowedAppToolNames } : {}
				});
				if (view) agentResult.details.mcpAppPreview = require_mcp_ui_resource.buildMcpAppCanvasPayload({
					...view,
					...result["_meta"] !== void 0 ? { resultMetaState: "unavailable" } : {}
				});
			}
			return agentResult;
		},
		createResourceListExecute: params.runtime.listResources ? (serverName) => async () => {
			params.runtime.markUsed();
			return toJsonAgentToolResult({
				serverName,
				operation: "resources_list",
				value: await params.runtime.listResources?.(serverName)
			});
		} : void 0,
		createResourceReadExecute: params.runtime.readResource ? (serverName) => async (_toolCallId, input) => {
			params.runtime.markUsed();
			return toJsonAgentToolResult({
				serverName,
				operation: "resources_read",
				value: await params.runtime.readResource?.(serverName, requireStringArg(input, "uri"))
			});
		} : void 0,
		createPromptListExecute: params.runtime.listPrompts ? (serverName) => async () => {
			params.runtime.markUsed();
			return toJsonAgentToolResult({
				serverName,
				operation: "prompts_list",
				value: await params.runtime.listPrompts?.(serverName)
			});
		} : void 0,
		createPromptGetExecute: params.runtime.getPrompt ? (serverName) => async (_toolCallId, input) => {
			params.runtime.markUsed();
			return toJsonAgentToolResult({
				serverName,
				operation: "prompts_get",
				value: await params.runtime.getPrompt?.(serverName, requireStringArg(input, "name"), optionalStringRecordArg(input, "arguments"))
			});
		} : void 0
	});
	return {
		tools,
		appTools: buildAppToolPolicyProjections({
			catalog,
			modelTools: tools,
			reservedToolNames
		}),
		...catalog.diagnostics && catalog.diagnostics.length > 0 ? { diagnostics: catalog.diagnostics } : {},
		restrictAppTools: (allowedTools) => {
			const next = /* @__PURE__ */ new Map();
			for (const allowedTool of allowedTools) {
				const mcp = require_tools.getPluginToolMeta(allowedTool)?.mcp;
				if (mcp?.operation !== "tool") continue;
				const names = next.get(mcp.serverName) ?? /* @__PURE__ */ new Set();
				names.add(mcp.toolName);
				next.set(mcp.serverName, names);
			}
			allowedAppToolsByServer = next;
		},
		dispose: async () => {
			if (disposed) return;
			disposed = true;
			releaseLease?.();
			await params.disposeRuntime?.();
		}
	};
}
async function createBundleMcpToolRuntime(params) {
	const runtime = (params.createRuntime ?? (await Promise.resolve().then(() => require("./agent-bundle-mcp-runtime-bT8ElU5D.cjs")).then((n) => n.agent_bundle_mcp_runtime_exports)).createSessionMcpRuntime)({
		sessionId: `bundle-mcp:${node_crypto.default.randomUUID()}`,
		workspaceDir: params.workspaceDir,
		cfg: params.cfg
	});
	return await materializeBundleMcpToolsForRun({
		runtime,
		reservedToolNames: params.reservedToolNames,
		disposeRuntime: async () => {
			await runtime.dispose();
		}
	});
}
//#endregion
Object.defineProperty(exports, "buildBundleMcpToolsFromCatalog", {
	enumerable: true,
	get: function() {
		return buildBundleMcpToolsFromCatalog;
	}
});
Object.defineProperty(exports, "createBundleMcpToolRuntime", {
	enumerable: true,
	get: function() {
		return createBundleMcpToolRuntime;
	}
});
Object.defineProperty(exports, "materializeBundleMcpToolsForRun", {
	enumerable: true,
	get: function() {
		return materializeBundleMcpToolsForRun;
	}
});
