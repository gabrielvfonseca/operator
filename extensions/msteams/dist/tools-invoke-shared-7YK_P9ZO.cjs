const require_logger = require("./logger-DFfd_p65.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
const require_config_activation_shared = require("./config-activation-shared-DPurBSAK.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_main_session = require("./main-session-x7hRR6eC.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_store = require("./store-DCwJguwr.cjs");
require("./sessions-BOjfaI9B.cjs");
require("./agent-tools-C4N0fa5t.cjs");
const require_conversation_read_origin = require("./conversation-read-origin-C-xn-esF.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_tool_loop_detection_config = require("./tool-loop-detection-config-c-3qUtKe.cjs");
const require_tool_resolution = require("./tool-resolution-BHDLwbdt.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/tools-invoke-shared.ts
const MEMORY_TOOL_NAMES = /* @__PURE__ */ new Set(["memory_search", "memory_get"]);
function resolveSessionKey(params) {
	const rawSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.sessionKey);
	if (rawSessionKey && rawSessionKey !== "main") return rawSessionKey;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.agentId);
	if (agentId) return require_session_accessor.canonicalizeSessionKeyForAgent(agentId, "main");
	return require_main_session.resolveMainSessionKey(params.cfg);
}
function resolveMemoryToolDisableReasons(cfg) {
	if (!process.env.VITEST) return [];
	const reasons = [];
	const plugins = cfg.plugins;
	const slotRaw = plugins?.slots?.memory;
	const slotDisabled = slotRaw === null || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(slotRaw) === "none";
	const pluginsDisabled = plugins?.enabled === false;
	const defaultDisabled = require_config_state.isTestDefaultMemorySlotDisabled(cfg);
	if (pluginsDisabled) reasons.push("plugins.enabled=false");
	if (slotDisabled) reasons.push(slotRaw === null ? "plugins.slots.memory=null" : "plugins.slots.memory=\"none\"");
	if (!pluginsDisabled && !slotDisabled && defaultDisabled) reasons.push("memory plugin disabled by test default");
	return reasons;
}
function mergeActionIntoArgsIfSupported(params) {
	const { toolSchema, action, args } = params;
	if (!action || args.action !== void 0) return args;
	const schemaObj = toolSchema;
	return Boolean(schemaObj && typeof schemaObj === "object" && schemaObj.properties && "action" in schemaObj.properties) ? {
		...args,
		action
	} : args;
}
function getErrorMessage(err) {
	if (err instanceof Error) return err.message || String(err);
	if (typeof err === "string") return err;
	return String(err);
}
function resolveToolInputErrorStatus(err) {
	if (err instanceof require_common.ToolInputError) {
		const status = err.status;
		return typeof status === "number" ? status : 400;
	}
	if (typeof err !== "object" || err === null || !("name" in err)) return null;
	const name = err.name;
	if (name !== "ToolInputError" && name !== "ToolAuthorizationError") return null;
	const status = err.status;
	if (typeof status === "number") return status;
	return name === "ToolAuthorizationError" ? 403 : 400;
}
function resolveToolSource(tool) {
	if (require_tools.getPluginToolMeta(tool)) return "plugin";
	if (require_gateway.getChannelAgentToolMeta(tool)) return "channel";
	return "core";
}
/** Resolves, authorizes, and invokes one gateway-visible core/plugin/channel tool. */
async function invokeGatewayTool(params) {
	const conversationReadOrigin = require_conversation_read_origin.normalizeConversationReadInvocationOrigin(params.conversationReadOrigin);
	const toolName = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.name ?? params.input.tool) ?? "";
	if (!toolName) return {
		ok: false,
		status: 400,
		toolName: "",
		error: {
			type: "invalid_request",
			message: "tools.invoke requires name"
		}
	};
	if (process.env.VITEST && MEMORY_TOOL_NAMES.has(toolName)) {
		const reasons = resolveMemoryToolDisableReasons(params.cfg);
		if (reasons.length > 0) return {
			ok: false,
			status: 400,
			toolName,
			error: {
				type: "invalid_request",
				message: `memory tools are disabled in tests${` (${reasons.join(", ")})`}. Enable by setting plugins.slots.memory="${require_config_activation_shared.defaultSlotIdForKey("memory")}" (and ensure plugins.enabled is not false).`
			}
		};
	}
	const knownCoreTool = require_tool_policy.isKnownCoreToolId(toolName);
	const gatewayRequestedTools = knownCoreTool ? [] : [toolName];
	const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.action);
	const argsRaw = params.input.args;
	const args = argsRaw && typeof argsRaw === "object" && !Array.isArray(argsRaw) ? argsRaw : {};
	const sessionKey = resolveSessionKey({
		cfg: params.cfg,
		input: params.input
	});
	const harnessEntry = require_store.isAgentHarnessSessionKey(sessionKey) ? require_session_accessor.resolveSessionEntryAccessTarget({
		cfg: params.cfg,
		sessionKey
	}).entry : void 0;
	if (require_store.isAgentHarnessSessionKey(sessionKey) && (!harnessEntry || require_store.isAgentHarnessSessionStoreEntryProtected(sessionKey, harnessEntry))) return {
		ok: false,
		status: 400,
		toolName,
		error: {
			type: "invalid_request",
			message: require_store.AGENT_HARNESS_SESSION_KEY_RESERVED_MESSAGE
		}
	};
	const resolveTools = (disablePluginTools) => require_tool_resolution.resolveGatewayScopedTools({
		cfg: params.cfg,
		sessionKey,
		messageProvider: params.messageChannel,
		accountId: params.accountId,
		agentTo: params.agentTo,
		agentThreadId: params.agentThreadId,
		senderIsOwner: params.senderIsOwner,
		clientCaps: params.clientCaps,
		conversationReadOrigin,
		allowGatewaySubagentBinding: true,
		allowMediaInvokeCommands: true,
		surface: "http",
		disablePluginTools,
		gatewayRequestedTools
	});
	let { agentId, tools, workspaceDir } = resolveTools(knownCoreTool);
	if (knownCoreTool && !tools.some((candidate) => candidate.name === toolName)) ({agentId, tools, workspaceDir} = resolveTools(false));
	const requestedAgentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.agentId);
	if (requestedAgentId && agentId && requestedAgentId !== agentId) return {
		ok: false,
		status: 400,
		toolName,
		error: {
			type: "invalid_request",
			message: `agent id "${requestedAgentId}" does not match session agent "${agentId}"`
		}
	};
	const tool = tools.find((candidate) => candidate.name === toolName);
	if (!tool) return {
		ok: false,
		status: 404,
		toolName,
		error: {
			type: "not_found",
			message: `Tool not available: ${toolName}`
		}
	};
	try {
		const gatewayTool = tool;
		const idempotencyKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.input.idempotencyKey);
		const toolCallId = idempotencyKey ? `${params.toolCallIdPrefix}-${conversationReadOrigin}-${idempotencyKey}` : `${params.toolCallIdPrefix}-${conversationReadOrigin}-${Date.now()}`;
		const hookResult = await require_hook_helpers.runBeforeToolCallHook({
			toolName,
			params: mergeActionIntoArgsIfSupported({
				toolSchema: gatewayTool.parameters,
				action,
				args
			}),
			toolCallId,
			ctx: {
				agentId,
				config: params.cfg,
				sessionKey,
				workspaceDir,
				loopDetection: require_tool_loop_detection_config.resolveToolLoopDetectionConfig({
					cfg: params.cfg,
					agentId
				})
			},
			approvalMode: params.approvalMode
		});
		if (hookResult.blocked) return {
			ok: false,
			status: 403,
			toolName,
			error: {
				type: "tool_call_blocked",
				message: hookResult.reason,
				requiresApproval: hookResult.deniedReason === "plugin-approval"
			}
		};
		return {
			ok: true,
			status: 200,
			toolName,
			source: resolveToolSource(gatewayTool),
			result: await gatewayTool.execute?.(toolCallId, hookResult.params)
		};
	} catch (err) {
		const inputStatus = resolveToolInputErrorStatus(err);
		if (inputStatus !== null) return {
			ok: false,
			status: inputStatus === 403 ? 403 : 400,
			toolName,
			error: {
				type: "tool_error",
				message: getErrorMessage(err) || "invalid tool arguments"
			}
		};
		require_logger.logWarn(`tools-invoke: tool execution failed: ${String(err)}`);
		return {
			ok: false,
			status: 500,
			toolName,
			error: {
				type: "tool_error",
				message: "tool execution failed"
			}
		};
	}
}
//#endregion
Object.defineProperty(exports, "invokeGatewayTool", {
	enumerable: true,
	get: function() {
		return invokeGatewayTool;
	}
});
