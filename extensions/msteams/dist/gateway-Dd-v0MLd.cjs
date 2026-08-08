require("./plugins-_-82JYfc.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_registry_normalize = require("./registry-normalize-BMEF8R5c.cjs");
const require_registry$1 = require("./registry-raOBfWNF.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_message_action_discovery = require("./message-action-discovery-BroWFszp.cjs");
const require_native_approval_prompt = require("./native-approval-prompt-CFA_Vpyy.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_agent_runtime_identity_token = require("./agent-runtime-identity-token-BGKguIG_.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_credential_planner = require("./credential-planner-DkEqYEWZ.cjs");
const require_credentials = require("./credentials-CNHX5M4G.cjs");
const require_method_scopes = require("./method-scopes-Dz-dMiDm.cjs");
const require_message_action_turn_capability = require("./message-action-turn-capability-BDaT1ykL.cjs");
const require_operator_approval_runtime_token = require("./operator-approval-runtime-token-BZxnDPVJ.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_async_hooks = require("node:async_hooks");
//#region src/agents/before-tool-call-metadata.ts
const BEFORE_TOOL_CALL_WRAPPED = Symbol("beforeToolCallWrapped");
const BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS = Symbol("beforeToolCallDiagnosticOptions");
const BEFORE_TOOL_CALL_SOURCE_TOOL = Symbol("beforeToolCallSourceTool");
const BEFORE_TOOL_CALL_HOOK_CONTEXT = Symbol("beforeToolCallHookContext");
/** Return true when a tool already carries the before_tool_call wrapper marker. */
function isToolWrappedWithBeforeToolCallHook(tool) {
	return tool[BEFORE_TOOL_CALL_WRAPPED] === true;
}
/** Copy before_tool_call marker metadata when another wrapper replaces a tool. */
function copyBeforeToolCallHookMarker(source, target) {
	if (!isToolWrappedWithBeforeToolCallHook(source)) return;
	Object.defineProperty(target, BEFORE_TOOL_CALL_WRAPPED, {
		value: true,
		enumerable: true
	});
	const taggedSource = source;
	const sourceTool = taggedSource[BEFORE_TOOL_CALL_SOURCE_TOOL];
	if (sourceTool && typeof sourceTool === "object") Object.defineProperty(target, BEFORE_TOOL_CALL_SOURCE_TOOL, {
		value: sourceTool,
		enumerable: false
	});
	const hookContext = taggedSource[BEFORE_TOOL_CALL_HOOK_CONTEXT];
	Object.defineProperty(target, BEFORE_TOOL_CALL_HOOK_CONTEXT, {
		value: hookContext,
		enumerable: false
	});
}
//#endregion
//#region src/agents/channel-tool-metadata.ts
const channelAgentToolMeta = /* @__PURE__ */ new WeakMap();
/** Read channel metadata attached to a channel-owned agent tool. */
function getChannelAgentToolMeta(tool) {
	return channelAgentToolMeta.get(tool);
}
/** Attach channel ownership metadata to a concrete agent tool. */
function setChannelAgentToolMeta(tool, meta) {
	channelAgentToolMeta.set(tool, meta);
}
/** Copy channel metadata when wrapping or replacing a channel-owned tool. */
function copyChannelAgentToolMeta(source, target) {
	const meta = channelAgentToolMeta.get(source);
	if (meta) channelAgentToolMeta.set(target, meta);
}
//#endregion
//#region src/agents/channel-tools.ts
/**
* Channel-owned agent tool and prompt helpers.
* Discovers channel tools, message actions, prompt capabilities, reaction
* guidance, and weakly-attached channel metadata for wrapped tools.
*/
/**
* Get the list of supported message actions for a specific channel.
* Returns an empty array if channel is not found or has no actions configured.
*/
function listChannelSupportedActions(params) {
	const channelId = require_message_action_discovery.resolveMessageActionDiscoveryChannelId(params.channel);
	if (!channelId) return [];
	const pluginActions = require_message_action_discovery.resolveCurrentChannelMessageToolDiscoveryAdapter(channelId);
	if (!pluginActions?.actions) return [];
	return require_message_action_discovery.resolveMessageActionDiscoveryForPlugin({
		pluginId: pluginActions.pluginId,
		actions: pluginActions.actions,
		context: require_message_action_discovery.createMessageActionDiscoveryContext(params),
		includeActions: true
	}).actions;
}
/**
* Get the list of all supported message actions across all configured channels.
*/
function listAllChannelSupportedActions(params) {
	const actions = /* @__PURE__ */ new Set();
	for (const plugin of require_registry$1.listChannelPlugins()) {
		const channelActions = require_message_action_discovery.resolveMessageActionDiscoveryForPlugin({
			pluginId: plugin.id,
			actions: plugin.actions,
			context: require_message_action_discovery.createMessageActionDiscoveryContext({
				...params,
				currentChannelProvider: plugin.id
			}),
			includeActions: true
		}).actions;
		for (const action of channelActions) actions.add(action);
	}
	return Array.from(actions);
}
/** List agent tools contributed by registered channel plugins. */
function listChannelAgentTools(params) {
	const tools = [];
	for (const plugin of require_registry$1.listChannelPlugins()) {
		const entry = plugin.agentTools;
		if (!entry) continue;
		const resolved = typeof entry === "function" ? entry(params) : entry;
		if (Array.isArray(resolved)) {
			for (const tool of resolved) setChannelAgentToolMeta(tool, { channelId: plugin.id });
			tools.push(...resolved);
		}
	}
	return tools;
}
/** Resolve channel-specific message tool hints for system prompt assembly. */
function resolveChannelMessageToolHints(params) {
	const channelId = require_registry_normalize.normalizeAnyChannelId(params.channel);
	if (!channelId) return [];
	const resolve = require_registry$1.getChannelPlugin(channelId)?.agentPrompt?.messageToolHints;
	if (!resolve) return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(resolve({
		cfg: params.cfg ?? {},
		accountId: params.accountId
	}));
}
/** Resolve channel prompt capabilities, including native approval UI support. */
function resolveChannelPromptCapabilities(params) {
	const channelId = require_registry_normalize.normalizeAnyChannelId(params.channel);
	if (!channelId) return [];
	const plugin = require_registry$1.getChannelPlugin(channelId);
	const cfg = params.cfg ?? {};
	const capabilities = normalizePromptCapabilities(plugin?.agentPrompt?.messageToolCapabilities?.({
		cfg,
		accountId: params.accountId
	}));
	if (require_native_approval_prompt.channelPluginHasNativeApprovalPromptUi(plugin)) capabilities.push(require_native_approval_prompt.NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY);
	return capabilities;
}
function normalizePromptCapabilities(capabilities) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(capabilities ?? []);
}
/** Resolve optional channel reaction guidance for assistant replies. */
function resolveChannelReactionGuidance(params) {
	const channelId = require_registry_normalize.normalizeAnyChannelId(params.channel);
	if (!channelId) return;
	const resolve = require_registry$1.getChannelPlugin(channelId)?.agentPrompt?.reactionGuidance;
	if (!resolve) return;
	const resolved = resolve({
		cfg: params.cfg ?? {},
		accountId: params.accountId
	});
	if (!resolved?.level) return;
	return {
		level: resolved.level,
		channel: resolved.channelLabel?.trim() || channelId
	};
}
//#endregion
//#region src/agents/tool-terminal-presentation.ts
const terminalPresentationByTool = /* @__PURE__ */ new WeakMap();
function setToolTerminalPresentation(tool, formatter) {
	terminalPresentationByTool.set(tool, formatter);
	return tool;
}
function getToolTerminalPresentation(tool) {
	return terminalPresentationByTool.get(tool);
}
function copyToolTerminalPresentation(source, target) {
	const formatter = terminalPresentationByTool.get(source);
	if (formatter) terminalPresentationByTool.set(target, formatter);
}
//#endregion
//#region src/agents/tools/gateway-caller-context.ts
const gatewayToolCallerStorage = new node_async_hooks.AsyncLocalStorage();
function getGatewayToolCallerIdentity() {
	return gatewayToolCallerStorage.getStore();
}
async function withGatewayToolCallerIdentity(identity, run) {
	if (!identity?.agentId?.trim() || !identity.sessionKey?.trim()) return await run();
	return await gatewayToolCallerStorage.run({
		agentId: identity.agentId.trim(),
		sessionKey: identity.sessionKey.trim(),
		...identity.turnSourceChannel?.trim() ? { turnSourceChannel: identity.turnSourceChannel.trim() } : {},
		...identity.turnSourceTo?.trim() ? { turnSourceTo: identity.turnSourceTo.trim() } : {},
		...identity.turnSourceAccountId?.trim() ? { turnSourceAccountId: identity.turnSourceAccountId.trim() } : {},
		...identity.turnSourceThreadId !== void 0 ? { turnSourceThreadId: identity.turnSourceThreadId } : {}
	}, run);
}
function wrapToolWithGatewayCallerIdentity(tool, identity) {
	if (!identity?.agentId?.trim() || !identity.sessionKey?.trim() || !tool.execute) return tool;
	const wrapped = {
		...tool,
		execute: async (...args) => await withGatewayToolCallerIdentity(identity, async () => await tool.execute?.(...args))
	};
	require_tools.copyPluginToolMeta(tool, wrapped);
	copyChannelAgentToolMeta(tool, wrapped);
	copyBeforeToolCallHookMarker(tool, wrapped);
	copyToolTerminalPresentation(tool, wrapped);
	return wrapped;
}
function createGatewayToolCallerWrapper(agentId, source) {
	const identity = agentId && source?.agentSessionKey?.trim() ? {
		agentId,
		sessionKey: source.agentSessionKey.trim(),
		turnSourceChannel: source.agentChannel,
		turnSourceTo: source.currentMessagingTarget ?? source.currentChannelId ?? source.agentTo,
		turnSourceAccountId: source.agentAccountId,
		turnSourceThreadId: source.currentThreadTs ?? source.agentThreadId
	} : void 0;
	return (tool) => wrapToolWithGatewayCallerIdentity(tool, identity);
}
//#endregion
//#region src/agents/tools/gateway.ts
/**
* Gateway call helpers for built-in tools.
*
* Resolves gateway URL/token overrides, local credentials, and least-privilege operator scopes.
*/
/** Reads common gateway options from tool parameters while preserving explicit token whitespace. */
function readGatewayCallOptions(params) {
	return {
		gatewayUrl: require_common.readStringParam(params, "gatewayUrl", { trim: false }),
		gatewayToken: require_common.readStringParam(params, "gatewayToken", { trim: false }),
		timeoutMs: require_common.readPositiveIntegerParam(params, "timeoutMs")
	};
}
/**
* Canonicalizes websocket URLs for allowlist comparisons without retaining paths or credentials.
*/
function canonicalizeToolGatewayWsUrl(raw) {
	const input = raw.trim();
	let url;
	try {
		url = new URL(input);
	} catch (error) {
		const message = require_errors.formatErrorMessage(error);
		throw new Error(`invalid gatewayUrl: ${input} (${message})`, { cause: error });
	}
	if (url.protocol !== "ws:" && url.protocol !== "wss:") throw new Error(`invalid gatewayUrl protocol: ${url.protocol} (expected ws:// or wss://)`);
	if (url.username || url.password) throw new Error("invalid gatewayUrl: credentials are not allowed");
	if (url.search || url.hash) throw new Error("invalid gatewayUrl: query/hash not allowed");
	if (url.pathname && url.pathname !== "/") throw new Error("invalid gatewayUrl: path not allowed");
	return {
		origin: url.origin,
		key: `${url.protocol}//${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(url.host)}`
	};
}
function resolveLocalGatewayUrlKeys(cfg) {
	const port = require_paths.resolveGatewayPort(cfg);
	return /* @__PURE__ */ new Set([
		`ws://127.0.0.1:${port}`,
		`wss://127.0.0.1:${port}`,
		`ws://localhost:${port}`,
		`wss://localhost:${port}`,
		`ws://[::1]:${port}`,
		`wss://[::1]:${port}`
	]);
}
function resolveConfiguredRemoteGatewayKey(cfg) {
	let remoteKey;
	const remoteUrl = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(cfg.gateway?.remote?.url) ?? "";
	if (remoteUrl) try {
		remoteKey = canonicalizeToolGatewayWsUrl(remoteUrl).key;
	} catch {}
	return remoteKey;
}
function resolveDefaultGatewayTarget(params) {
	if (params.envGatewayUrl) return "remote";
	if (params.cfg.gateway?.mode === "remote" && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cfg.gateway.remote?.url)) return "remote";
	return "local";
}
function validateGatewayUrlOverrideForAgentTools(params) {
	const { cfg } = params;
	const localAllowed = resolveLocalGatewayUrlKeys(cfg);
	const remoteKey = resolveConfiguredRemoteGatewayKey(cfg);
	const parsed = canonicalizeToolGatewayWsUrl(params.urlOverride);
	if (localAllowed.has(parsed.key)) return {
		url: parsed.origin,
		target: "local"
	};
	if (remoteKey && parsed.key === remoteKey) return {
		url: parsed.origin,
		target: "remote"
	};
	const port = require_paths.resolveGatewayPort(cfg);
	throw new Error([
		"gatewayUrl override rejected.",
		`Allowed: ws(s) loopback on port ${port} (127.0.0.1/localhost/[::1])`,
		"Or: configure gateway.remote.url and omit gatewayUrl to use the configured remote gateway."
	].join(" "));
}
function resolveGatewayOverrideToken(params) {
	if (params.explicitToken) return params.explicitToken;
	return require_credentials.resolveGatewayCredentialsFromConfig({
		cfg: params.cfg,
		env: process.env,
		modeOverride: params.target,
		remoteTokenFallback: params.target === "remote" ? "remote-only" : "remote-env-local",
		remotePasswordFallback: params.target === "remote" ? "remote-only" : "remote-env-local"
	}).token;
}
/**
* Resolves the gateway URL, token, and timeout for agent tool calls.
*/
function resolveGatewayOptions(opts) {
	const cfg = require_io.getRuntimeConfig();
	const validatedOverride = require_credential_planner.trimToUndefined(opts?.gatewayUrl) !== void 0 ? validateGatewayUrlOverrideForAgentTools({
		cfg,
		urlOverride: String(opts?.gatewayUrl)
	}) : void 0;
	const explicitToken = require_credential_planner.trimToUndefined(opts?.gatewayToken);
	const token = validatedOverride ? resolveGatewayOverrideToken({
		cfg,
		target: validatedOverride.target,
		explicitToken
	}) : explicitToken;
	const timeoutMs = typeof opts?.timeoutMs === "number" && Number.isFinite(opts.timeoutMs) ? Math.max(1, Math.floor(opts.timeoutMs)) : 3e4;
	const envGatewayUrl = require_credential_planner.trimToUndefined(process.env.OPERATOR_GATEWAY_URL);
	const target = validatedOverride?.target ?? resolveDefaultGatewayTarget({
		cfg,
		envGatewayUrl
	});
	return {
		url: validatedOverride?.url,
		token,
		timeoutMs,
		target
	};
}
const APPROVAL_RUNTIME_METHODS = /* @__PURE__ */ new Set([
	"exec.approval.request",
	"exec.approval.resolve",
	"exec.approval.waitDecision",
	"plugin.approval.request",
	"plugin.approval.waitDecision"
]);
const AGENT_RUNTIME_IDENTITY_METHODS = /* @__PURE__ */ new Set([
	"wake",
	"cron.list",
	"cron.get",
	"cron.add",
	"cron.update",
	"cron.remove",
	"cron.run",
	"cron.runs"
]);
const OPTIONAL_LOCAL_AGENT_RUNTIME_IDENTITY_METHODS = /* @__PURE__ */ new Set(["node.invoke"]);
function resolveApprovalRuntimeTokenForGatewayTool(params) {
	if (!APPROVAL_RUNTIME_METHODS.has(params.method)) return;
	if (require_credential_planner.trimToUndefined(params.opts.gatewayUrl) !== void 0) return;
	if (params.target !== "local") return;
	return require_operator_approval_runtime_token.getOperatorApprovalRuntimeToken();
}
function isApprovalReplayNodeSystemRun(method, callParams) {
	const invoke = method === "node.invoke" ? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(callParams) : null;
	const run = invoke?.command === "system.run" ? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(invoke.params) : null;
	const decision = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(run?.approvalDecision);
	return run?.approved === true || decision === "allow-once" || decision === "allow-always";
}
function attachNodeInvokeTurnSource(method, params) {
	if (method !== "node.invoke") return params;
	const invoke = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(params);
	const caller = getGatewayToolCallerIdentity();
	if (!invoke || !caller) return params;
	return {
		...omitNodeInvokeTurnSource(invoke),
		...caller.turnSourceChannel ? { turnSourceChannel: caller.turnSourceChannel } : {},
		...caller.turnSourceTo ? { turnSourceTo: caller.turnSourceTo } : {},
		...caller.turnSourceAccountId ? { turnSourceAccountId: caller.turnSourceAccountId } : {},
		...caller.turnSourceThreadId !== void 0 ? { turnSourceThreadId: caller.turnSourceThreadId } : {}
	};
}
function omitNodeInvokeTurnSource(invoke) {
	const legacyParams = { ...invoke };
	delete legacyParams.turnSourceChannel;
	delete legacyParams.turnSourceTo;
	delete legacyParams.turnSourceAccountId;
	delete legacyParams.turnSourceThreadId;
	return legacyParams;
}
function stripNodeInvokeTurnSource(params) {
	const invoke = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(params);
	return invoke ? omitNodeInvokeTurnSource(invoke) : params;
}
function resolveApprovalRequesterDeviceIdentityForGatewayTool(params) {
	const isApprovalRuntimeMethod = APPROVAL_RUNTIME_METHODS.has(params.method);
	const isNodeApprovalReplay = isApprovalReplayNodeSystemRun(params.method, params.callParams);
	if (!isApprovalRuntimeMethod && !isNodeApprovalReplay) return;
	if (isApprovalRuntimeMethod && require_credential_planner.trimToUndefined(params.opts.gatewayUrl) !== void 0) return;
	try {
		if (isNodeApprovalReplay) {
			const identity = require_device_identity.loadDeviceIdentityIfPresent();
			if (!identity) throw new Error("device identity is not persisted");
			return identity;
		}
		const identity = require_device_identity.loadOrCreateDeviceIdentity();
		if (require_device_identity.loadDeviceIdentityIfPresent()?.deviceId !== identity.deviceId) throw new Error("device identity is not persisted");
		return identity;
	} catch (error) {
		if (isNodeApprovalReplay) throw new Error(["approved node gateway calls require a stable device identity.", "Fix the Operator state directory permissions and retry the approval."].join(" "), { cause: error });
		if (params.target === "local") return;
		throw new Error(["remote approval gateway calls require a stable device identity.", "Fix the Operator state directory permissions or use the local approval-runtime gateway."].join(" "), { cause: error });
	}
}
async function resolveAgentRuntimeIdentityTokenForGatewayTool(params) {
	const optionalLocalIdentity = OPTIONAL_LOCAL_AGENT_RUNTIME_IDENTITY_METHODS.has(params.method);
	if (!params.required && !AGENT_RUNTIME_IDENTITY_METHODS.has(params.method) && !optionalLocalIdentity) return;
	const identity = getGatewayToolCallerIdentity();
	if (!identity) {
		if (params.required) throw new Error("trusted agent runtime identity required for this gateway call");
		return;
	}
	const hasGatewayUrlOverride = require_credential_planner.trimToUndefined(params.opts.gatewayUrl) !== void 0;
	const hasGatewayTokenOverride = require_credential_planner.trimToUndefined(params.opts.gatewayToken) !== void 0;
	if (hasGatewayUrlOverride || hasGatewayTokenOverride || params.target !== "local") {
		if (optionalLocalIdentity && !params.required) return;
		throw new Error("agent gateway calls require the trusted local gateway context");
	}
	try {
		return await require_agent_runtime_identity_token.mintAgentRuntimeIdentityToken(identity);
	} catch (error) {
		if (optionalLocalIdentity && !params.required) return;
		throw error;
	}
}
async function resolveMessageActionAgentRuntimeIdentityToken(params) {
	const terminalSourceReply = params.sourceReplyFinal === true;
	const sourceReplyToolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sourceReplyToolCallId);
	if (terminalSourceReply && !sourceReplyToolCallId) throw new Error("terminal source reply requires tool-call correlation");
	const identity = getGatewayToolCallerIdentity();
	if (!identity) {
		if (terminalSourceReply) throw new Error("terminal source reply requires trusted agent runtime identity");
		return;
	}
	const hasGatewayUrlOverride = require_credential_planner.trimToUndefined(params.opts.gatewayUrl) !== void 0;
	const hasGatewayTokenOverride = require_credential_planner.trimToUndefined(params.opts.gatewayToken) !== void 0;
	const usesUntrustedGatewayContext = hasGatewayUrlOverride || hasGatewayTokenOverride || params.target !== "local";
	if (usesUntrustedGatewayContext && !terminalSourceReply) return;
	const messageActionContext = require_message_action_turn_capability.resolveMessageActionTurnCapability({
		token: params.turnCapability,
		agentId: identity.agentId,
		runId: params.runId,
		sessionKey: identity.sessionKey,
		sessionId: params.sessionId
	});
	if (!messageActionContext) {
		if (terminalSourceReply) throw new Error("terminal source reply requires an active turn capability");
		return;
	}
	if (terminalSourceReply && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(messageActionContext.toolContext?.currentSourceTurnId)) throw new Error("terminal source reply requires source-turn correlation");
	if (usesUntrustedGatewayContext) {
		if (params.callerOwnsTerminalReceipt !== true) throw new Error("terminal source reply requires the trusted local gateway context");
		return;
	}
	const resolvedMessageActionContext = terminalSourceReply ? {
		...messageActionContext,
		sourceReplyFinal: true,
		sourceReplyToolCallId
	} : {
		...messageActionContext,
		...params.sourceReplyFinal === false ? { sourceReplyFinal: false } : {},
		...sourceReplyToolCallId ? { sourceReplyToolCallId } : {}
	};
	return await require_agent_runtime_identity_token.mintAgentRuntimeIdentityToken({
		...identity,
		messageActionContext: resolvedMessageActionContext
	});
}
function isStaleGatewayAgentRuntimeIdentityRejection(error) {
	const message = require_errors.formatErrorMessage(error);
	if (message.includes("gateway rejected required agent runtime identity auth field; refusing to retry without it")) return true;
	return message.includes("invalid connect params") && message.includes("/auth") && message.includes("unexpected property 'agentRuntimeIdentityToken'");
}
function isStaleGatewayNodeInvokeTurnSourceRejection(error) {
	if (!(error instanceof Error) || error.name !== "GatewayClientRequestError") return false;
	const requestError = error;
	if (requestError.gatewayCode !== require_error_codes.ErrorCodes.INVALID_REQUEST) return false;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(requestError.details)?.nodeCommandDispatched === true) return false;
	const message = require_errors.formatErrorMessage(error);
	if (!message.includes("invalid node.invoke params:")) return false;
	return [
		"turnSourceChannel",
		"turnSourceTo",
		"turnSourceAccountId",
		"turnSourceThreadId"
	].some((field) => message.includes(`unexpected property '${field}'`));
}
function staleGatewayAgentRuntimeIdentityError(cause) {
	return new Error(["The running Gateway is from an older Operator build and rejected current agent runtime connection metadata.", "Restart the Gateway with `openclaw gateway restart`, then retry."].join(" "), { cause });
}
/**
* Calls a gateway method as the agent-tool backend client with least-privilege scopes.
*/
async function callGatewayTool(method, opts, params, extra) {
	const gateway = resolveGatewayOptions(opts);
	const callParams = attachNodeInvokeTurnSource(method, params);
	const scopes = Array.isArray(extra?.scopes) ? extra.scopes : require_method_scopes.resolveLeastPrivilegeOperatorScopesForMethod(method, callParams);
	const approvalRuntimeToken = resolveApprovalRuntimeTokenForGatewayTool({
		method,
		opts,
		target: gateway.target
	});
	const agentRuntimeIdentityToken = await resolveAgentRuntimeIdentityTokenForGatewayTool({
		method,
		opts,
		target: gateway.target,
		required: extra?.requireAgentRuntimeIdentity
	});
	const deviceIdentity = resolveApprovalRequesterDeviceIdentityForGatewayTool({
		method,
		callParams,
		opts,
		target: gateway.target
	});
	const callOptions = {
		url: gateway.url,
		token: gateway.token,
		method,
		params: callParams,
		timeoutMs: gateway.timeoutMs,
		signal: extra?.signal,
		expectFinal: extra?.expectFinal,
		clientName: require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
		clientDisplayName: "agent",
		mode: require_client_info.GATEWAY_CLIENT_MODES.BACKEND,
		...approvalRuntimeToken ? { approvalRuntimeToken } : {},
		...agentRuntimeIdentityToken ? { agentRuntimeIdentityToken } : {},
		...deviceIdentity ? { deviceIdentity } : {},
		scopes
	};
	try {
		return await require_call.callGateway(callOptions);
	} catch (error) {
		if (method === "node.invoke" && isStaleGatewayNodeInvokeTurnSourceRejection(error)) return await require_call.callGateway({
			...callOptions,
			params: stripNodeInvokeTurnSource(callOptions.params)
		});
		if (agentRuntimeIdentityToken && isStaleGatewayAgentRuntimeIdentityRejection(error)) {
			if (method === "node.invoke" && extra?.requireAgentRuntimeIdentity !== true) return await require_call.callGateway({
				...callOptions,
				params: stripNodeInvokeTurnSource(callOptions.params),
				agentRuntimeIdentityToken: void 0
			});
			throw staleGatewayAgentRuntimeIdentityError(error);
		}
		throw error;
	}
}
//#endregion
Object.defineProperty(exports, "BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS", {
	enumerable: true,
	get: function() {
		return BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS;
	}
});
Object.defineProperty(exports, "BEFORE_TOOL_CALL_HOOK_CONTEXT", {
	enumerable: true,
	get: function() {
		return BEFORE_TOOL_CALL_HOOK_CONTEXT;
	}
});
Object.defineProperty(exports, "BEFORE_TOOL_CALL_SOURCE_TOOL", {
	enumerable: true,
	get: function() {
		return BEFORE_TOOL_CALL_SOURCE_TOOL;
	}
});
Object.defineProperty(exports, "BEFORE_TOOL_CALL_WRAPPED", {
	enumerable: true,
	get: function() {
		return BEFORE_TOOL_CALL_WRAPPED;
	}
});
Object.defineProperty(exports, "callGatewayTool", {
	enumerable: true,
	get: function() {
		return callGatewayTool;
	}
});
Object.defineProperty(exports, "copyBeforeToolCallHookMarker", {
	enumerable: true,
	get: function() {
		return copyBeforeToolCallHookMarker;
	}
});
Object.defineProperty(exports, "copyChannelAgentToolMeta", {
	enumerable: true,
	get: function() {
		return copyChannelAgentToolMeta;
	}
});
Object.defineProperty(exports, "copyToolTerminalPresentation", {
	enumerable: true,
	get: function() {
		return copyToolTerminalPresentation;
	}
});
Object.defineProperty(exports, "createGatewayToolCallerWrapper", {
	enumerable: true,
	get: function() {
		return createGatewayToolCallerWrapper;
	}
});
Object.defineProperty(exports, "getChannelAgentToolMeta", {
	enumerable: true,
	get: function() {
		return getChannelAgentToolMeta;
	}
});
Object.defineProperty(exports, "getToolTerminalPresentation", {
	enumerable: true,
	get: function() {
		return getToolTerminalPresentation;
	}
});
Object.defineProperty(exports, "isToolWrappedWithBeforeToolCallHook", {
	enumerable: true,
	get: function() {
		return isToolWrappedWithBeforeToolCallHook;
	}
});
Object.defineProperty(exports, "listAllChannelSupportedActions", {
	enumerable: true,
	get: function() {
		return listAllChannelSupportedActions;
	}
});
Object.defineProperty(exports, "listChannelAgentTools", {
	enumerable: true,
	get: function() {
		return listChannelAgentTools;
	}
});
Object.defineProperty(exports, "listChannelSupportedActions", {
	enumerable: true,
	get: function() {
		return listChannelSupportedActions;
	}
});
Object.defineProperty(exports, "readGatewayCallOptions", {
	enumerable: true,
	get: function() {
		return readGatewayCallOptions;
	}
});
Object.defineProperty(exports, "resolveChannelMessageToolHints", {
	enumerable: true,
	get: function() {
		return resolveChannelMessageToolHints;
	}
});
Object.defineProperty(exports, "resolveChannelPromptCapabilities", {
	enumerable: true,
	get: function() {
		return resolveChannelPromptCapabilities;
	}
});
Object.defineProperty(exports, "resolveChannelReactionGuidance", {
	enumerable: true,
	get: function() {
		return resolveChannelReactionGuidance;
	}
});
Object.defineProperty(exports, "resolveGatewayOptions", {
	enumerable: true,
	get: function() {
		return resolveGatewayOptions;
	}
});
Object.defineProperty(exports, "resolveMessageActionAgentRuntimeIdentityToken", {
	enumerable: true,
	get: function() {
		return resolveMessageActionAgentRuntimeIdentityToken;
	}
});
Object.defineProperty(exports, "setToolTerminalPresentation", {
	enumerable: true,
	get: function() {
		return setToolTerminalPresentation;
	}
});
Object.defineProperty(exports, "withGatewayToolCallerIdentity", {
	enumerable: true,
	get: function() {
		return withGatewayToolCallerIdentity;
	}
});
Object.defineProperty(exports, "wrapToolWithGatewayCallerIdentity", {
	enumerable: true,
	get: function() {
		return wrapToolWithGatewayCallerIdentity;
	}
});
