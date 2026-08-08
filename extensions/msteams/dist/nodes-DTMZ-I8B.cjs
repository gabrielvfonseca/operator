require("./rolldown-runtime-u92d-OFm.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_client_info = require("./client-info-C2lg7w_c.cjs");
const require_operator_scopes = require("./operator-scopes-BT4c3sSd.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_node_commands = require("./node-commands-DQ3xnEUk.cjs");
const require_workspace = require("./workspace-BaJ9ukou.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
const require_node_command_policy = require("./node-command-policy-DFyVSMm6.cjs");
const require_src = require("./src-Bh1Dm1hT.cjs");
const require_system_run_approval_context = require("./system-run-approval-context-CNsyRgtv.cjs");
const require_device_pairing = require("./device-pairing-DpNh5_Ue.cjs");
const require_node_pairing = require("./node-pairing-B0aSCGFJ.cjs");
const require_remote = require("./remote-Dds9m5_I.cjs");
const require_push_apns_store = require("./push-apns-store-THiqtBab.cjs");
const require_push_apns = require("./push-apns-Dgss9aNs.cjs");
const require_exec_approval_manager = require("./exec-approval-manager-bD7WDZkA.cjs");
const require_device_management_security = require("./device-management-security-D2eB2nWl.cjs");
const require_node_catalog = require("./node-catalog-BavRyR-l.cjs");
const require_nodes_helpers = require("./nodes.helpers-SXr8Ur2w.cjs");
const require_node_invoke_plugin_policy = require("./node-invoke-plugin-policy-DabO7jAG.cjs");
const require_plugin_node_capability = require("./plugin-node-capability-BqUNVkTg.cjs");
const require_nodes_wake_state = require("./nodes-wake-state-hWzDuFh6.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/gateway/node-invoke-system-run-approval-errors.ts
/** Builds a failed system.run approval guard result with a structured code. */
function systemRunApprovalGuardError(params) {
	const details = params.details ? { ...params.details } : {};
	return {
		ok: false,
		message: params.message,
		details: {
			code: params.code,
			...details
		}
	};
}
/** Builds the standard response for system.run calls that still need approval. */
function systemRunApprovalRequired(runId) {
	return systemRunApprovalGuardError({
		code: "APPROVAL_REQUIRED",
		message: "approval required",
		details: { runId }
	});
}
//#endregion
//#region src/gateway/node-invoke-system-run-approval-match.ts
function requestMismatch() {
	return {
		ok: false,
		code: "APPROVAL_REQUEST_MISMATCH",
		message: "approval id does not match request"
	};
}
/** Evaluates whether a node system.run request matches the stored approval binding. */
function evaluateSystemRunApprovalMatch(params) {
	if (params.request.host !== "node") return requestMismatch();
	const actualBinding = require_system_run_approval_context.buildSystemRunApprovalBinding({
		argv: params.argv,
		cwd: params.binding.cwd,
		agentId: params.binding.agentId,
		sessionKey: params.binding.sessionKey,
		env: params.binding.env
	});
	const expectedBinding = params.request.systemRunBinding;
	if (!expectedBinding) return require_system_run_approval_context.missingSystemRunApprovalBinding({ actualEnvKeys: actualBinding.envKeys });
	return require_system_run_approval_context.matchSystemRunApprovalBinding({
		expected: expectedBinding,
		actual: actualBinding.binding,
		actualEnvKeys: actualBinding.envKeys
	});
}
//#endregion
//#region src/gateway/node-invoke-system-run-approval.ts
const BACKEND_BRIDGEABLE_NO_DEVICE_REQUEST_CLIENT_IDS = /* @__PURE__ */ new Set([
	require_client_info.GATEWAY_CLIENT_NAMES.CONTROL_UI,
	require_client_info.GATEWAY_CLIENT_NAMES.WEBCHAT_UI,
	require_client_info.GATEWAY_CLIENT_NAMES.WEBCHAT,
	require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT
]);
function normalizeApprovalDecision(value) {
	const s = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(value);
	return s === "allow-once" || s === "allow-always" ? s : null;
}
function clientHasApprovals(client) {
	const scopes = Array.isArray(client?.connect?.scopes) ? client?.connect?.scopes : [];
	return scopes.includes("operator.admin") || scopes.includes("operator.approvals");
}
function isTrustedBackendApprovalClient(client) {
	return clientHasApprovals(client) && client?.connect?.client?.id === require_client_info.GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT && client.connect.client.mode === require_client_info.GATEWAY_CLIENT_MODES.BACKEND && client.isDeviceTokenAuth !== true;
}
function canBridgeNoDeviceApprovalFromBackend(params) {
	const requestedByClientId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(params.snapshot.requestedByClientId);
	const request = params.snapshot.request;
	return params.snapshot.requestedByDeviceId == null && params.snapshot.requestedByDeviceTokenAuth !== true && !hasChatApprovalReplayBinding(request) && requestedByClientId !== null && BACKEND_BRIDGEABLE_NO_DEVICE_REQUEST_CLIENT_IDS.has(requestedByClientId) && isTrustedBackendApprovalClient(params.client);
}
function hasChatApprovalReplayBinding(request) {
	return normalizeComparableString(request.turnSourceChannel, { lowercase: true }) !== null || normalizeComparableString(request.turnSourceTo) !== null || normalizeComparableString(request.turnSourceAccountId) !== null || normalizeComparableString(request.turnSourceThreadId) !== null;
}
function normalizeComparableString(value, opts = {}) {
	const normalized = typeof value === "number" && Number.isFinite(value) ? String(value) : (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(value);
	if (!normalized) return null;
	return opts.lowercase ? normalized.toLowerCase() : normalized;
}
function matchesRequiredString(params) {
	const expected = normalizeComparableString(params.expected, { lowercase: params.lowercase });
	if (!expected) return false;
	return expected === normalizeComparableString(params.actual, { lowercase: params.lowercase });
}
function matchesOptionalString(params) {
	const expected = normalizeComparableString(params.expected, { lowercase: params.lowercase });
	if (!expected) return true;
	return expected === normalizeComparableString(params.actual, { lowercase: params.lowercase });
}
function canBridgeNoDeviceChatApprovalFromBackend(params) {
	if (params.snapshot.requestedByDeviceId != null || params.snapshot.requestedByDeviceTokenAuth === true || !isTrustedBackendApprovalClient(params.client)) return false;
	const request = params.snapshot.request;
	const plan = request.systemRunPlan ?? null;
	return matchesRequiredString({
		expected: request.turnSourceChannel,
		actual: params.rawParams.turnSourceChannel,
		lowercase: true
	}) && matchesOptionalString({
		expected: request.turnSourceTo,
		actual: params.rawParams.turnSourceTo
	}) && matchesRequiredString({
		expected: plan?.sessionKey ?? request.sessionKey,
		actual: params.rawParams.sessionKey
	}) && matchesOptionalString({
		expected: plan?.agentId ?? request.agentId,
		actual: params.rawParams.agentId
	}) && matchesOptionalString({
		expected: request.turnSourceAccountId,
		actual: params.rawParams.turnSourceAccountId
	}) && matchesOptionalString({
		expected: request.turnSourceThreadId,
		actual: params.rawParams.turnSourceThreadId
	});
}
function pickSystemRunParams(raw) {
	const next = {};
	for (const key of [
		"command",
		"rawCommand",
		"systemRunPlan",
		"cwd",
		"env",
		"timeoutMs",
		"needsScreenRecording",
		"agentId",
		"sessionKey",
		"runId",
		"suppressNotifyOnExit"
	]) if (key in raw) next[key] = raw[key];
	return next;
}
function resolveForwardedRawCommand(plan) {
	const preview = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(plan.commandPreview);
	if (!preview) return plan.commandText;
	const resolved = require_system_run_approval_context.resolveSystemRunCommandRequest({
		command: plan.argv,
		rawCommand: preview
	});
	return resolved.ok && resolved.previewText === preview ? preview : plan.commandText;
}
/**
* Gate `system.run` approval flags (`approved`, `approvalDecision`) behind a real
* `exec.approval.*` record. This prevents users with only `operator.write` from
* bypassing node-host approvals by injecting control fields into `node.invoke`.
*/
function sanitizeSystemRunParamsForForwarding(opts) {
	const obj = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(opts.rawParams);
	if (!obj) return {
		ok: true,
		params: opts.rawParams
	};
	const p = obj;
	const approved = p.approved === true;
	const requestedDecision = normalizeApprovalDecision(p.approvalDecision);
	if (p.approvalSource != null && p.approvalSource !== "ask-fallback") return systemRunApprovalGuardError({
		code: "INVALID_APPROVAL_SOURCE",
		message: "approval source invalid"
	});
	const approvalSource = p.approvalSource === "ask-fallback" ? "ask-fallback" : null;
	if (approvalSource !== null && (p.approved !== void 0 || p.approvalDecision !== void 0)) return systemRunApprovalGuardError({
		code: "APPROVAL_SOURCE_MISMATCH",
		message: "approval source cannot be combined with explicit approval"
	});
	const wantsApprovalOverride = approved || requestedDecision !== null || approvalSource !== null;
	const next = pickSystemRunParams(obj);
	if (!wantsApprovalOverride) {
		const cmdTextResolution = require_system_run_approval_context.resolveSystemRunCommandRequest({
			command: p.command,
			rawCommand: p.rawCommand
		});
		if (!cmdTextResolution.ok) return {
			ok: false,
			message: cmdTextResolution.message,
			details: cmdTextResolution.details
		};
		return {
			ok: true,
			params: next
		};
	}
	const runId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(p.runId);
	if (!runId) return systemRunApprovalGuardError({
		code: "MISSING_RUN_ID",
		message: "approval override requires params.runId"
	});
	const manager = opts.execApprovalManager;
	if (!manager) return systemRunApprovalGuardError({
		code: "APPROVALS_UNAVAILABLE",
		message: "exec approvals unavailable"
	});
	const snapshot = manager.getSnapshot(runId);
	if (!snapshot) return systemRunApprovalGuardError({
		code: "UNKNOWN_APPROVAL_ID",
		message: "unknown or expired approval id",
		details: { runId }
	});
	const recordedResolutionSource = snapshot.resolutionSource ?? "operator";
	if (recordedResolutionSource !== "operator" && recordedResolutionSource !== "auto-review") return systemRunApprovalGuardError({
		code: "INVALID_APPROVAL_SOURCE",
		message: "approval record source invalid",
		details: { runId }
	});
	if (recordedResolutionSource === "auto-review" && snapshot.decision !== "allow-once") {
		if (snapshot.consumedDecision === "allow-once") return systemRunApprovalRequired(runId);
		return systemRunApprovalGuardError({
			code: "APPROVAL_SOURCE_MISMATCH",
			message: "auto-review source does not match approval decision",
			details: { runId }
		});
	}
	const timedOut = snapshot.resolvedAtMs !== void 0 && snapshot.decision === void 0 && snapshot.consumedDecision === void 0 && snapshot.askFallbackConsumed !== true;
	const nowMs = typeof opts.nowMs === "number" ? opts.nowMs : Date.now();
	const timeoutReplayExpiresAtMs = snapshot.resolvedAtMs === void 0 ? snapshot.expiresAtMs : snapshot.resolvedAtMs + require_exec_approval_manager.EXEC_APPROVAL_RESOLVED_ENTRY_GRACE_MS;
	if (timedOut ? nowMs > timeoutReplayExpiresAtMs : nowMs > snapshot.expiresAtMs) return systemRunApprovalGuardError({
		code: "APPROVAL_EXPIRED",
		message: "approval expired",
		details: { runId }
	});
	const targetNodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(opts.nodeId);
	if (!targetNodeId) return systemRunApprovalGuardError({
		code: "MISSING_NODE_ID",
		message: "node.invoke requires nodeId",
		details: { runId }
	});
	const approvalNodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeNullableString)(snapshot.request.nodeId);
	if (!approvalNodeId) return systemRunApprovalGuardError({
		code: "APPROVAL_NODE_BINDING_MISSING",
		message: "approval id missing node binding",
		details: { runId }
	});
	if (approvalNodeId !== targetNodeId) return systemRunApprovalGuardError({
		code: "APPROVAL_NODE_MISMATCH",
		message: "approval id not valid for this node",
		details: { runId }
	});
	const snapshotDeviceId = snapshot.requestedByDeviceId ?? null;
	const clientDeviceId = opts.client?.connect?.device?.id ?? null;
	if (snapshotDeviceId) {
		if (snapshotDeviceId !== clientDeviceId) return systemRunApprovalGuardError({
			code: "APPROVAL_DEVICE_MISMATCH",
			message: "approval id not valid for this device",
			details: { runId }
		});
	} else if (snapshot.requestedByConnId && snapshot.requestedByConnId !== (opts.client?.connId ?? null) && !canBridgeNoDeviceApprovalFromBackend({
		snapshot,
		client: opts.client
	}) && !canBridgeNoDeviceChatApprovalFromBackend({
		snapshot,
		rawParams: p,
		client: opts.client
	})) return systemRunApprovalGuardError({
		code: "APPROVAL_CLIENT_MISMATCH",
		message: "approval id not valid for this client",
		details: { runId }
	});
	const runtimeContext = require_system_run_approval_context.resolveSystemRunApprovalRuntimeContext({
		plan: snapshot.request.systemRunPlan ?? null,
		command: p.command,
		rawCommand: p.rawCommand,
		cwd: p.cwd,
		agentId: p.agentId,
		sessionKey: p.sessionKey
	});
	if (!runtimeContext.ok) return {
		ok: false,
		message: runtimeContext.message,
		details: runtimeContext.details
	};
	if (runtimeContext.plan) {
		next.command = [...runtimeContext.plan.argv];
		next.systemRunPlan = runtimeContext.plan;
		next.rawCommand = resolveForwardedRawCommand(runtimeContext.plan);
		if (runtimeContext.cwd) next.cwd = runtimeContext.cwd;
		else delete next.cwd;
		if (runtimeContext.agentId) next.agentId = runtimeContext.agentId;
		else delete next.agentId;
		if (runtimeContext.sessionKey) next.sessionKey = runtimeContext.sessionKey;
		else delete next.sessionKey;
	}
	const approvalMatch = evaluateSystemRunApprovalMatch({
		argv: runtimeContext.argv,
		request: snapshot.request,
		binding: {
			cwd: runtimeContext.cwd,
			agentId: runtimeContext.agentId,
			sessionKey: runtimeContext.sessionKey,
			env: p.env
		}
	});
	if (!approvalMatch.ok) return require_system_run_approval_context.toSystemRunApprovalMismatchError({
		runId,
		match: approvalMatch
	});
	if (snapshot.decision === "allow-once") {
		if (approvalSource !== null) return systemRunApprovalGuardError({
			code: "APPROVAL_SOURCE_MISMATCH",
			message: "approval source does not match approval record",
			details: { runId }
		});
		if (recordedResolutionSource === "auto-review") {
			if (!runtimeContext.plan) return systemRunApprovalGuardError({
				code: "APPROVAL_PLAN_REQUIRED",
				message: "auto-review approval requires an approved execution plan",
				details: { runId }
			});
		}
		if (typeof manager.consumeAllowOnce !== "function" || !manager.consumeAllowOnce(runId)) return systemRunApprovalRequired(runId);
		if (recordedResolutionSource === "auto-review") {
			next.approvalSource = "auto-review";
			return {
				ok: true,
				params: next
			};
		}
		next.approved = true;
		next.approvalDecision = "allow-once";
		return {
			ok: true,
			params: next
		};
	}
	if (snapshot.decision === "allow-always") {
		if (approvalSource !== null) return systemRunApprovalGuardError({
			code: "APPROVAL_SOURCE_MISMATCH",
			message: "approval source does not match approval record",
			details: { runId }
		});
		next.approved = true;
		next.approvalDecision = "allow-always";
		return {
			ok: true,
			params: next
		};
	}
	if (timedOut && approvalSource === "ask-fallback" && !approved && requestedDecision === null && clientHasApprovals(opts.client)) {
		if (!runtimeContext.plan) return systemRunApprovalGuardError({
			code: "APPROVAL_PLAN_REQUIRED",
			message: "ask fallback requires an approved execution plan",
			details: { runId }
		});
		if (typeof manager.consumeAskFallback !== "function" || !manager.consumeAskFallback(runId)) return systemRunApprovalRequired(runId);
		next.approvalSource = "ask-fallback";
		return {
			ok: true,
			params: next
		};
	}
	return systemRunApprovalRequired(runId);
}
//#endregion
//#region src/gateway/node-invoke-sanitize.ts
/** Sanitizes node.invoke params before forwarding them to a connected node. */
function sanitizeNodeInvokeParamsForForwarding(opts) {
	if (opts.command === "system.run") return sanitizeSystemRunParamsForForwarding({
		nodeId: opts.nodeId,
		rawParams: opts.rawParams,
		client: opts.client,
		execApprovalManager: opts.execApprovalManager
	});
	return {
		ok: true,
		params: opts.rawParams
	};
}
//#endregion
//#region src/gateway/server-methods/node-browser-proxy.ts
function normalizeBrowserProxyPath(value) {
	const trimmed = value.trim();
	if (!trimmed) return trimmed;
	const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	if (withLeadingSlash.length <= 1) return withLeadingSlash;
	return withLeadingSlash.replace(/\/+$/, "");
}
function isPersistentBrowserProxyMutation(method, path) {
	const normalizedPath = normalizeBrowserProxyPath(path);
	if (method === "POST" && (normalizedPath === "/profiles/create" || normalizedPath === "/reset-profile")) return true;
	return method === "DELETE" && /^\/profiles\/[^/]+$/.test(normalizedPath);
}
function isForbiddenBrowserProxyMutation(params) {
	if (!params || typeof params !== "object") return false;
	const candidate = params;
	const method = ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.method) ?? "").toUpperCase();
	const path = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(candidate.path) ?? "";
	return Boolean(method && path && isPersistentBrowserProxyMutation(method, path));
}
//#endregion
//#region src/gateway/server-methods/node-command-rejection-hint.ts
function buildNodeCommandRejectionHint(reason, command, node, cfg) {
	const platform = node?.platform ?? "unknown";
	if (reason === "command not declared by node") return `node command not allowed: the node (platform: ${platform}) does not support "${command}"`;
	if (reason === "command not allowlisted") {
		if (command.startsWith("talk.")) return `node command not allowed: "${command}" requires a trusted Talk-capable node`;
		if ((cfg.gateway?.nodes?.denyCommands ?? []).some((entry) => entry.trim() === command)) return `node command not allowed: "${command}" is blocked by gateway.nodes.denyCommands`;
		if (require_node_command_policy.DEFAULT_DANGEROUS_NODE_COMMANDS.includes(command)) return `node command not allowed: "${command}" requires explicit gateway.nodes.allowCommands opt-in`;
		return `node command not allowed: "${command}" is not in the allowlist for platform "${platform}"`;
	}
	if (reason === "node did not declare commands") {
		if (node?.declaredCommands?.includes(command)) return "node command not allowed: the node's declared command surface is pending approval; run `operator nodes pending`, then `operator nodes approve <requestId>`";
		return `node command not allowed: the node did not declare any supported commands`;
	}
	return `node command not allowed: ${reason}`;
}
//#endregion
//#region src/gateway/server-methods/nodes-policy.ts
const nodeInvokePolicy = {
	wakeThrottleMs: 15e3,
	wakeNudgeThrottleMs: 10 * 6e4,
	pendingActionTtlMs: 10 * 6e4,
	pendingActionMaxPerNode: 64,
	canReadPendingNodePairing(client) {
		const scopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
		return scopes.includes("operator.admin") || scopes.includes("operator.pairing");
	},
	clientHasOperatorAdminScope(client) {
		return (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(require_operator_scopes.ADMIN_SCOPE);
	},
	rejectClaudeAgentRun(command, respond) {
		if (command !== "agent.cli.claude.run.v1") return false;
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "node.invoke does not allow Claude agent runs; use sessions.catalog.continue", { details: { command } }));
		return true;
	}
};
//#endregion
//#region src/gateway/server-methods/nodes.handlers.invoke-progress.ts
const MAX_PROGRESS_CHUNK_BYTES = 16 * 1024;
/** Accept one bounded stdout chunk for an active node invocation. */
const handleNodeInvokeProgress = async ({ params, respond, context, client }) => {
	if (!require_src.validateNodeInvokeProgressParams(params)) {
		require_nodes_helpers.respondInvalidParams({
			respond,
			method: "node.invoke.progress",
			validator: require_src.validateNodeInvokeProgressParams
		});
		return;
	}
	const progress = params;
	const callerNodeId = client?.connect?.device?.id ?? client?.connect?.client?.id;
	if (callerNodeId && callerNodeId !== progress.nodeId) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId mismatch"));
		return;
	}
	if (Buffer.byteLength(progress.chunk, "utf8") > MAX_PROGRESS_CHUNK_BYTES) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "progress chunk too large"));
		return;
	}
	respond(true, {
		ok: true,
		ignored: !context.nodeRegistry.handleInvokeProgress({
			...progress,
			connId: client?.connId
		})
	}, void 0);
};
//#endregion
//#region src/gateway/server-methods/nodes.handlers.invoke-result.ts
function normalizeNodeInvokeResultParams(params) {
	if (!params || typeof params !== "object") return params;
	const normalized = { ...params };
	if (normalized.payloadJSON === null) delete normalized.payloadJSON;
	else if (normalized.payloadJSON !== void 0 && typeof normalized.payloadJSON !== "string") {
		if (normalized.payload === void 0) normalized.payload = normalized.payloadJSON;
		delete normalized.payloadJSON;
	}
	if (normalized.error === null) delete normalized.error;
	return normalized;
}
/** Handle a node's response to an earlier gateway `node.invoke` request. */
const handleNodeInvokeResult = async ({ params, respond, context, client }) => {
	const normalizedParams = normalizeNodeInvokeResultParams(params);
	if (!require_src.validateNodeInvokeResultParams(normalizedParams)) {
		require_nodes_helpers.respondInvalidParams({
			respond,
			method: "node.invoke.result",
			validator: require_src.validateNodeInvokeResultParams
		});
		return;
	}
	const p = normalizedParams;
	const callerNodeId = client?.connect?.device?.id ?? client?.connect?.client?.id;
	if (callerNodeId && callerNodeId !== p.nodeId) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId mismatch"));
		return;
	}
	if (!context.nodeRegistry.handleInvokeResult({
		id: p.id,
		nodeId: p.nodeId,
		connId: client?.connId,
		ok: p.ok,
		payload: p.payload,
		payloadJSON: p.payloadJSON ?? null,
		error: p.error ?? null
	})) {
		context.logGateway.debug(`late invoke result ignored: id=${p.id} node=${p.nodeId}`);
		respond(true, {
			ok: true,
			ignored: true
		}, void 0);
		return;
	}
	respond(true, { ok: true }, void 0);
};
//#endregion
//#region src/gateway/server-methods/nodes.ts
const TALK_PTT_COMMANDS = /* @__PURE__ */ new Set([
	"talk.ptt.start",
	"talk.ptt.stop",
	"talk.ptt.cancel",
	"talk.ptt.once"
]);
const ADMIN_ONLY_NODE_INVOKE_COMMANDS = new Set(require_node_commands.NODE_ADMIN_ONLY_INVOKE_COMMANDS);
const talkPttEventSeqBySessionId = /* @__PURE__ */ new Map();
const pendingNodeActionsById = /* @__PURE__ */ new Map();
function safeNodeReadProjection(node, ownDeviceId) {
	if (!node.paired && !node.connected) return null;
	const { pendingRequestId, pendingDeclaredCaps: _pendingDeclaredCaps, pendingDeclaredCommands: _pendingDeclaredCommands, pendingDeclaredPermissions: _pendingDeclaredPermissions, ...safeNode } = node;
	return node.nodeId === ownDeviceId && pendingRequestId ? {
		...safeNode,
		pendingRequestId
	} : safeNode;
}
function nodeReadCallerDeviceId(client) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id);
}
function isVisibleNode(node) {
	return node !== null;
}
function listNodesForClient(params) {
	const nodes = require_node_catalog.listKnownNodes(require_node_catalog.createKnownNodeCatalog({
		pairedDevices: params.pairedDevices,
		pairedNodes: params.pairedNodes,
		pendingNodes: params.pendingNodes,
		connectedNodes: params.connectedNodes
	}));
	if (nodeInvokePolicy.canReadPendingNodePairing(params.client)) return nodes;
	const ownDeviceId = nodeReadCallerDeviceId(params.client);
	return nodes.map((node) => safeNodeReadProjection(node, ownDeviceId)).filter(isVisibleNode);
}
function normalizePluginSurfaceRefreshParams(params) {
	if (!params || typeof params !== "object") return;
	const surface = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.surface);
	if (!surface) return;
	return { surface };
}
function respondRefreshedPluginSurface(params) {
	const refreshed = params.client ? require_plugin_node_capability.refreshClientPluginNodeCapability({
		client: params.client,
		surface: params.client.pluginNodeCapabilitySurfaces?.[params.surface] ?? { surface: params.surface }
	}) : void 0;
	if (!refreshed) {
		params.respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, `${params.surface} plugin surface unavailable`));
		return;
	}
	params.respond(true, {
		surface: refreshed.surface,
		pluginSurfaceUrls: { [refreshed.surface]: refreshed.scopedUrl },
		expiresAtMs: refreshed.expiresAtMs
	}, void 0);
}
async function resolveDirectNodePushConfig() {
	const auth = await require_push_apns.resolveApnsAuthConfigFromEnv(process.env);
	return auth.ok ? {
		ok: true,
		auth: auth.value
	} : {
		ok: false,
		error: auth.error
	};
}
function resolveRelayNodePushConfig(cfg, registration) {
	const relay = require_push_apns_store.resolveApnsRelayConfigFromEnv(process.env, cfg.gateway, { registrationRelayOrigin: registration.relayOrigin });
	return relay.ok ? {
		ok: true,
		relayConfig: relay.value
	} : {
		ok: false,
		error: relay.error
	};
}
async function clearStaleApnsRegistrationIfNeeded(registration, nodeId, params) {
	if (!require_push_apns.shouldClearStoredApnsRegistration({
		registration,
		result: params
	})) return;
	await require_push_apns_store.clearApnsRegistrationIfCurrent({
		nodeId,
		registration
	});
}
async function delayMs(ms) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
function isForegroundRestrictedIosCommand(command) {
	return require_node_command_policy.isForegroundRestrictedPluginNodeCommand(command) || command.startsWith("camera.") || command.startsWith("screen.") || command.startsWith("talk.");
}
function shouldQueueAsPendingForegroundAction(params) {
	const platform = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.platform);
	if (!platform.startsWith("ios") && !platform.startsWith("ipados")) return false;
	if (!isForegroundRestrictedIosCommand(params.command)) return false;
	const error = params.error && typeof params.error === "object" ? params.error : null;
	const code = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(error?.code)?.toUpperCase() ?? "";
	const message = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(error?.message)?.toUpperCase() ?? "";
	return code === "NODE_BACKGROUND_UNAVAILABLE" || message.includes("BACKGROUND_UNAVAILABLE");
}
function prunePendingNodeActions(nodeId, nowMs) {
	const queue = pendingNodeActionsById.get(nodeId) ?? [];
	const minTimestampMs = nowMs - nodeInvokePolicy.pendingActionTtlMs;
	const live = queue.filter((entry) => entry.enqueuedAtMs >= minTimestampMs);
	if (live.length === 0) {
		pendingNodeActionsById.delete(nodeId);
		return [];
	}
	pendingNodeActionsById.set(nodeId, live);
	return live;
}
function clearRemovedNodeRuntimeState(params) {
	pendingNodeActionsById.delete(params.nodeId);
	params.context.nodeRegistry.updateSurface(params.nodeId, {
		caps: [],
		commands: [],
		permissions: void 0
	});
	require_remote.removeRemoteNodeInfo(params.nodeId);
}
function broadcastRemovedNodePairing(params) {
	params.context.broadcast("node.pair.resolved", {
		requestId: "",
		nodeId: params.nodeId,
		decision: "removed",
		ts: Date.now()
	}, { dropIfSlow: true });
}
function emitNodeRoleRemovalSecurityEvent(params) {
	const denied = params.reason !== void 0;
	require_device_management_security.emitDeviceManagementSecurityEvent({
		action: denied ? "device.role.removal_denied" : "device.role.removed",
		outcome: denied ? "denied" : "success",
		severity: "medium",
		authz: params.authz,
		targetDeviceId: params.deviceId,
		policyId: "gateway.device-pairing",
		decision: denied ? "deny" : "allow",
		controlId: "node.pair.remove",
		...params.reason ? { reason: params.reason } : {},
		attributes: {
			role: "node",
			...params.removedDevice !== void 0 ? { removed_device: params.removedDevice } : {}
		}
	});
}
async function removePairedDeviceBackedNode(params) {
	const nodeId = params.nodeId.trim();
	if (!nodeId) return { status: "unknown" };
	const paired = await require_device_pairing.getPairedDevice(nodeId);
	if (!paired || !require_device_pairing.listApprovedPairedDeviceRoles(paired).includes("node")) return { status: "unknown" };
	const authz = require_device_management_security.resolveDeviceManagementAuthz(params.client, nodeId);
	if (require_device_management_security.deniesCrossDeviceManagement(authz)) {
		params.context.logGateway.warn(`node pairing removal denied node=${nodeId} reason=device-ownership-mismatch`);
		emitNodeRoleRemovalSecurityEvent({
			authz,
			deviceId: nodeId,
			reason: "device-ownership-mismatch"
		});
		return {
			status: "denied",
			message: "node pairing removal denied"
		};
	}
	if (authz.callerDeviceId && !authz.isAdminCaller && require_device_management_security.pairedDeviceHasNonOperatorRole(paired)) {
		params.context.logGateway.warn(`node pairing removal denied node=${nodeId} reason=role-management-requires-admin`);
		emitNodeRoleRemovalSecurityEvent({
			authz,
			deviceId: nodeId,
			reason: "role-management-requires-admin"
		});
		return {
			status: "denied",
			message: "node pairing removal denied"
		};
	}
	const removed = await require_device_pairing.removePairedDeviceRole({
		deviceId: nodeId,
		role: "node"
	});
	if (!removed) return { status: "unknown" };
	params.context.logGateway.info(`node pairing removed device-backed node=${removed.deviceId}`);
	emitNodeRoleRemovalSecurityEvent({
		authz,
		deviceId: removed.deviceId,
		removedDevice: removed.removedDevice
	});
	params.context.invalidateClientsForDevice?.(removed.deviceId, {
		role: "node",
		reason: "device-pair-removed"
	});
	return {
		status: "removed",
		nodeId: removed.deviceId,
		disconnectDeviceId: removed.deviceId
	};
}
function enqueuePendingNodeAction(params) {
	const nowMs = Date.now();
	const queue = prunePendingNodeActions(params.nodeId, nowMs);
	const existing = queue.find((entry) => entry.idempotencyKey === params.idempotencyKey);
	if (existing) return existing;
	const entry = {
		id: (0, node_crypto.randomUUID)(),
		nodeId: params.nodeId,
		command: params.command,
		paramsJSON: params.paramsJSON,
		idempotencyKey: params.idempotencyKey,
		enqueuedAtMs: nowMs
	};
	queue.push(entry);
	if (queue.length > nodeInvokePolicy.pendingActionMaxPerNode) queue.splice(0, queue.length - nodeInvokePolicy.pendingActionMaxPerNode);
	pendingNodeActionsById.set(params.nodeId, queue);
	return entry;
}
function listPendingNodeActions(nodeId) {
	return prunePendingNodeActions(nodeId, Date.now());
}
function refreshConnectedNodeSurfaceCaches(params) {
	const cfg = params.cfg ?? params.context.getRuntimeConfig();
	const { nodeSession } = params;
	require_remote.recordRemoteNodeInfo({
		nodeId: nodeSession.nodeId,
		connId: nodeSession.connId,
		displayName: nodeSession.displayName,
		platform: nodeSession.platform,
		deviceFamily: nodeSession.deviceFamily,
		commands: nodeSession.commands,
		remoteIp: nodeSession.remoteIp
	});
	require_remote.refreshRemoteNodeBins({
		nodeId: nodeSession.nodeId,
		platform: nodeSession.platform,
		deviceFamily: nodeSession.deviceFamily,
		commands: nodeSession.commands,
		cfg
	}).catch((err) => params.context.logGateway.warn(`remote bin probe failed for ${nodeSession.nodeId}: ${require_errors.formatErrorMessage(err)}`));
}
function resolveAllowedPendingNodeActions(params) {
	const pending = listPendingNodeActions(params.nodeId);
	if (pending.length === 0) return pending;
	const connect = params.client?.connect;
	const declaredCommands = Array.isArray(connect?.commands) ? connect.commands : [];
	const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(params.cfg, {
		platform: connect?.client?.platform,
		deviceFamily: connect?.client?.deviceFamily,
		caps: connect?.caps,
		commands: declaredCommands
	});
	const allowed = pending.filter((entry) => {
		return require_node_command_policy.isNodeCommandAllowed({
			command: entry.command,
			declaredCommands,
			allowlist
		}).ok;
	});
	if (allowed.length !== pending.length) if (allowed.length === 0) pendingNodeActionsById.delete(params.nodeId);
	else pendingNodeActionsById.set(params.nodeId, allowed);
	return allowed;
}
function ackPendingNodeActions(nodeId, ids) {
	if (ids.length === 0) return listPendingNodeActions(nodeId);
	const pending = prunePendingNodeActions(nodeId, Date.now());
	const idSet = new Set(ids);
	const remaining = pending.filter((entry) => !idSet.has(entry.id));
	if (remaining.length === 0) {
		pendingNodeActionsById.delete(nodeId);
		return [];
	}
	pendingNodeActionsById.set(nodeId, remaining);
	return remaining;
}
function toPendingParamsJSON(params) {
	if (params === void 0) return;
	try {
		return JSON.stringify(params);
	} catch {
		return;
	}
}
function emitTalkPttNodeEvent(params) {
	if (!TALK_PTT_COMMANDS.has(params.command)) return;
	const payloadObj = typeof params.payload === "object" && params.payload !== null ? params.payload : {};
	const captureId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payloadObj.captureId) ?? (0, node_crypto.randomUUID)();
	const sessionId = `node:${params.nodeId}:talk:${captureId}`;
	const seq = (talkPttEventSeqBySessionId.get(sessionId) ?? 0) + 1;
	talkPttEventSeqBySessionId.set(sessionId, seq);
	while (talkPttEventSeqBySessionId.size > 2048) {
		const oldest = talkPttEventSeqBySessionId.keys().next().value;
		if (oldest === void 0) break;
		talkPttEventSeqBySessionId.delete(oldest);
	}
	const type = params.command === "talk.ptt.start" ? "capture.started" : params.command === "talk.ptt.cancel" ? "capture.cancelled" : params.command === "talk.ptt.once" ? "capture.once" : "capture.stopped";
	const final = params.command !== "talk.ptt.start";
	const talkEvent = {
		id: `${sessionId}:${seq}`,
		type,
		sessionId,
		captureId,
		seq,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		mode: "stt-tts",
		transport: "managed-room",
		brain: "agent-consult",
		final,
		payload: {
			nodeId: params.nodeId,
			command: params.command,
			status: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payloadObj.status) ?? void 0,
			transcript: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payloadObj.transcript) ?? void 0
		}
	};
	params.context.broadcast("talk.event", {
		nodeId: params.nodeId,
		command: params.command,
		talkEvent
	}, { dropIfSlow: true });
}
async function maybeWakeNodeWithApns(nodeId, opts) {
	const state = require_nodes_wake_state.nodeWakeById.get(nodeId) ?? { lastWakeAtMs: 0 };
	require_nodes_wake_state.nodeWakeById.set(nodeId, state);
	if (state.inFlight) return await state.inFlight;
	const now = Date.now();
	if (!(opts?.force === true) && state.lastWakeAtMs > 0 && now - state.lastWakeAtMs < nodeInvokePolicy.wakeThrottleMs) return {
		available: true,
		throttled: true,
		path: "throttled",
		durationMs: 0
	};
	state.inFlight = (async () => {
		const startedAtMs = Date.now();
		const withDuration = (attempt) => ({
			...attempt,
			durationMs: Math.max(0, Date.now() - startedAtMs)
		});
		try {
			const registration = await require_push_apns_store.loadApnsRegistration(nodeId);
			if (!registration) {
				require_nodes_wake_state.nodeWakeById.delete(nodeId);
				return withDuration({
					available: false,
					throttled: false,
					path: "no-registration"
				});
			}
			let wakeResult;
			if (registration.transport === "relay") {
				const relay = resolveRelayNodePushConfig(opts?.cfg ?? require_io.getRuntimeConfig(), registration);
				if (!relay.ok) return withDuration({
					available: false,
					throttled: false,
					path: "no-auth",
					apnsReason: relay.error
				});
				state.lastWakeAtMs = Date.now();
				wakeResult = await require_push_apns.sendApnsBackgroundWake({
					registration,
					nodeId,
					wakeReason: opts?.wakeReason ?? "node.invoke",
					relayConfig: relay.relayConfig
				});
			} else {
				const auth = await resolveDirectNodePushConfig();
				if (!auth.ok) return withDuration({
					available: false,
					throttled: false,
					path: "no-auth",
					apnsReason: auth.error
				});
				state.lastWakeAtMs = Date.now();
				wakeResult = await require_push_apns.sendApnsBackgroundWake({
					registration,
					nodeId,
					wakeReason: opts?.wakeReason ?? "node.invoke",
					auth: auth.auth
				});
			}
			await clearStaleApnsRegistrationIfNeeded(registration, nodeId, wakeResult);
			if (!wakeResult.ok) return withDuration({
				available: true,
				throttled: false,
				path: "send-error",
				apnsStatus: wakeResult.status,
				apnsReason: wakeResult.reason
			});
			return withDuration({
				available: true,
				throttled: false,
				path: "sent",
				apnsStatus: wakeResult.status,
				apnsReason: wakeResult.reason
			});
		} catch (err) {
			const message = require_errors.formatErrorMessage(err);
			if (state.lastWakeAtMs === 0) return withDuration({
				available: false,
				throttled: false,
				path: "send-error",
				apnsReason: message
			});
			return withDuration({
				available: true,
				throttled: false,
				path: "send-error",
				apnsReason: message
			});
		}
	})();
	try {
		return await state.inFlight;
	} finally {
		state.inFlight = void 0;
	}
}
async function maybeSendNodeWakeNudge(nodeId, opts) {
	const startedAtMs = Date.now();
	const withDuration = (attempt) => ({
		...attempt,
		durationMs: Math.max(0, Date.now() - startedAtMs)
	});
	const lastNudgeAtMs = require_nodes_wake_state.nodeWakeNudgeById.get(nodeId) ?? 0;
	if (lastNudgeAtMs > 0 && Date.now() - lastNudgeAtMs < nodeInvokePolicy.wakeNudgeThrottleMs) return withDuration({
		sent: false,
		throttled: true,
		reason: "throttled"
	});
	const registration = await require_push_apns_store.loadApnsRegistration(nodeId);
	if (!registration) return withDuration({
		sent: false,
		throttled: false,
		reason: "no-registration"
	});
	try {
		let result;
		if (registration.transport === "relay") {
			const relay = resolveRelayNodePushConfig(opts?.cfg ?? require_io.getRuntimeConfig(), registration);
			if (!relay.ok) return withDuration({
				sent: false,
				throttled: false,
				reason: "no-auth",
				apnsReason: relay.error
			});
			result = await require_push_apns.sendApnsAlert({
				registration,
				nodeId,
				title: "Operator needs a quick reopen",
				body: "Tap to reopen Operator and restore the node connection.",
				relayConfig: relay.relayConfig
			});
		} else {
			const auth = await resolveDirectNodePushConfig();
			if (!auth.ok) return withDuration({
				sent: false,
				throttled: false,
				reason: "no-auth",
				apnsReason: auth.error
			});
			result = await require_push_apns.sendApnsAlert({
				registration,
				nodeId,
				title: "Operator needs a quick reopen",
				body: "Tap to reopen Operator and restore the node connection.",
				auth: auth.auth
			});
		}
		await clearStaleApnsRegistrationIfNeeded(registration, nodeId, result);
		if (!result.ok) return withDuration({
			sent: false,
			throttled: false,
			reason: "apns-not-ok",
			apnsStatus: result.status,
			apnsReason: result.reason
		});
		require_nodes_wake_state.nodeWakeNudgeById.set(nodeId, Date.now());
		return withDuration({
			sent: true,
			throttled: false,
			reason: "sent",
			apnsStatus: result.status,
			apnsReason: result.reason
		});
	} catch (err) {
		return withDuration({
			sent: false,
			throttled: false,
			reason: "send-error",
			apnsReason: require_errors.formatErrorMessage(err)
		});
	}
}
async function waitForNodeReconnect(params) {
	const timeoutMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.timeoutMs, require_nodes_wake_state.NODE_WAKE_RECONNECT_WAIT_MS, 250);
	const pollMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(params.pollMs, 150, 50);
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (params.context.nodeRegistry.get(params.nodeId)) return true;
		await delayMs(pollMs);
	}
	return Boolean(params.context.nodeRegistry.get(params.nodeId));
}
const nodeHandlers = {
	"node.pair.list": async ({ params, respond }) => {
		if (!require_src.validateNodePairListParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pair.list",
				validator: require_src.validateNodePairListParams
			});
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			respond(true, await require_node_pairing.listNodePairing(), void 0);
		});
	},
	"node.pair.approve": async ({ params, respond, context, client }) => {
		if (!require_src.validateNodePairApproveParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pair.approve",
				validator: require_src.validateNodePairApproveParams
			});
			return;
		}
		const { requestId } = params;
		const callerScopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const approved = await require_node_pairing.approveNodePairing(requestId, { callerScopes });
			if (!approved) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			if ("status" in approved && approved.status === "forbidden") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `missing scope: ${approved.missingScope}`));
				return;
			}
			if (!("node" in approved)) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			const approvedNode = approved.node;
			const cfg = context.getRuntimeConfig();
			const currentAllowlist = require_node_command_policy.resolveNodePairingCommandAllowlist(cfg, {
				platform: approvedNode.platform,
				deviceFamily: approvedNode.deviceFamily,
				caps: approvedNode.caps,
				commands: approvedNode.commands,
				approvedCommands: approvedNode.commands
			});
			const currentAllowedCommands = require_node_command_policy.normalizeDeclaredNodeCommands({
				declaredCommands: approvedNode.commands ?? [],
				allowlist: currentAllowlist
			});
			const updatedNode = context.nodeRegistry.updateSurface(approvedNode.nodeId, {
				caps: approvedNode.caps ?? [],
				commands: currentAllowedCommands,
				permissions: approvedNode.permissions
			});
			if (updatedNode) refreshConnectedNodeSurfaceCaches({
				context,
				nodeSession: updatedNode,
				cfg
			});
			context.broadcast("node.pair.resolved", {
				requestId,
				nodeId: approvedNode.nodeId,
				decision: "approved",
				ts: Date.now()
			}, { dropIfSlow: true });
			respond(true, approved, void 0);
		});
	},
	"node.pair.reject": async ({ params, respond, context }) => {
		if (!require_src.validateNodePairRejectParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pair.reject",
				validator: require_src.validateNodePairRejectParams
			});
			return;
		}
		const { requestId } = params;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const rejected = await require_node_pairing.rejectNodePairing(requestId);
			if (!rejected) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			context.broadcast("node.pair.resolved", {
				requestId,
				nodeId: rejected.nodeId,
				decision: "rejected",
				ts: Date.now()
			}, { dropIfSlow: true });
			respond(true, rejected, void 0);
		});
	},
	"node.pair.remove": async ({ params, respond, context, client }) => {
		if (!require_src.validateNodePairRemoveParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pair.remove",
				validator: require_src.validateNodePairRemoveParams
			});
			return;
		}
		const { nodeId } = params;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const deviceBacked = await removePairedDeviceBackedNode({
				nodeId,
				client,
				context
			});
			if (deviceBacked.status === "denied") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, deviceBacked.message));
				return;
			}
			if (deviceBacked.status !== "removed") {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			try {
				clearRemovedNodeRuntimeState({
					nodeId: deviceBacked.nodeId,
					context
				});
				broadcastRemovedNodePairing({
					nodeId: deviceBacked.nodeId,
					context
				});
				respond(true, { nodeId: deviceBacked.nodeId }, void 0);
			} finally {
				queueMicrotask(() => {
					context.disconnectClientsForDevice?.(deviceBacked.disconnectDeviceId, { role: "node" });
				});
			}
		});
	},
	"node.rename": async ({ params, respond }) => {
		if (!require_src.validateNodeRenameParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.rename",
				validator: require_src.validateNodeRenameParams
			});
			return;
		}
		const { nodeId, displayName } = params;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const trimmed = displayName.trim();
			if (!trimmed) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "displayName required"));
				return;
			}
			const updated = await require_node_pairing.renamePairedNode(nodeId, trimmed);
			if (!updated) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			respond(true, {
				nodeId: updated.nodeId,
				displayName: updated.displayName
			}, void 0);
		});
	},
	"node.list": async ({ params, respond, client, context }) => {
		if (!require_src.validateNodeListParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.list",
				validator: require_src.validateNodeListParams
			});
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const [devicePairing, nodePairing] = await Promise.all([require_device_pairing.listDevicePairing(), require_node_pairing.listNodePairing()]);
			const nodes = listNodesForClient({
				client,
				pairedDevices: devicePairing.paired,
				pairedNodes: nodePairing.paired,
				pendingNodes: nodePairing.pending,
				connectedNodes: context.nodeRegistry.listConnected()
			});
			const activeNodeId = context.nodeRegistry.getActiveNode()?.nodeId;
			const nodesWithPresence = activeNodeId ? nodes.map((node) => node.nodeId === activeNodeId ? {
				...node,
				active: true
			} : node) : nodes;
			respond(true, {
				ts: Date.now(),
				activeNodeId,
				nodes: nodesWithPresence
			}, void 0);
		});
	},
	"node.describe": async ({ params, respond, client, context }) => {
		if (!require_src.validateNodeDescribeParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.describe",
				validator: require_src.validateNodeDescribeParams
			});
			return;
		}
		const { nodeId } = params;
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(nodeId) ?? "";
		if (!id) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const [devicePairing, nodePairing] = await Promise.all([require_device_pairing.listDevicePairing(), require_node_pairing.listNodePairing()]);
			const catalogNode = require_node_catalog.getKnownNode(require_node_catalog.createKnownNodeCatalog({
				pairedDevices: devicePairing.paired,
				pairedNodes: nodePairing.paired,
				pendingNodes: nodePairing.pending,
				connectedNodes: context.nodeRegistry.listConnected()
			}), id);
			const node = catalogNode && nodeInvokePolicy.canReadPendingNodePairing(client) ? catalogNode : catalogNode ? safeNodeReadProjection(catalogNode, nodeReadCallerDeviceId(client)) : null;
			if (!node) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			respond(true, {
				ts: Date.now(),
				...node,
				...context.nodeRegistry.getActiveNode()?.nodeId === id ? { active: true } : {}
			}, void 0);
		});
	},
	"node.pluginSurface.refresh": async ({ params, respond, client }) => {
		const parsed = normalizePluginSurfaceRefreshParams(params);
		if (!parsed) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "surface required"));
			return;
		}
		respondRefreshedPluginSurface({
			surface: parsed.surface,
			client,
			respond
		});
	},
	"node.pluginTools.update": async ({ params, respond, client, context }) => {
		if (!require_src.validateNodePluginToolsUpdateParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pluginTools.update",
				validator: require_src.validateNodePluginToolsUpdateParams
			});
			return;
		}
		const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id ?? client?.connect?.client?.id);
		if (!nodeId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const updated = context.nodeRegistry.updateNodePluginTools(nodeId, client?.connId, params.tools);
		if (!updated) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
			return;
		}
		respond(true, {
			nodeId,
			tools: updated.nodePluginTools
		}, void 0);
	},
	"node.skills.update": async ({ params, respond, client, context }) => {
		if (!require_src.validateNodeSkillsUpdateParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.skills.update",
				validator: require_src.validateNodeSkillsUpdateParams
			});
			return;
		}
		const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id ?? client?.connect?.client?.id);
		if (!nodeId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const updated = context.nodeRegistry.updateNodeSkills(nodeId, client?.connId, params.skills);
		if (!updated) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
			return;
		}
		require_workspace.replaceRemoteNodeSkills({
			nodeId,
			displayName: updated.displayName,
			skills: updated.nodeSkills
		});
		respond(true, {
			nodeId,
			skills: updated.nodeSkills
		}, void 0);
	},
	"node.pending.pull": async ({ params, respond, client, context }) => {
		if (!require_src.validateNodeListParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pending.pull",
				validator: require_src.validateNodeListParams
			});
			return;
		}
		const trimmedNodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id ?? client?.connect?.client?.id) ?? "";
		if (!trimmedNodeId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		respond(true, {
			nodeId: trimmedNodeId,
			actions: resolveAllowedPendingNodeActions({
				nodeId: trimmedNodeId,
				client,
				cfg: context.getRuntimeConfig()
			}).map((entry) => ({
				id: entry.id,
				command: entry.command,
				paramsJSON: entry.paramsJSON ?? null,
				enqueuedAtMs: entry.enqueuedAtMs
			}))
		}, void 0);
	},
	"node.pending.ack": async ({ params, respond, client }) => {
		if (!require_src.validateNodePendingAckParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.pending.ack",
				validator: require_src.validateNodePendingAckParams
			});
			return;
		}
		const trimmedNodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(client?.connect?.device?.id ?? client?.connect?.client?.id) ?? "";
		if (!trimmedNodeId) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const ackIds = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueTrimmedStringList)(params.ids);
		respond(true, {
			nodeId: trimmedNodeId,
			ackedIds: ackIds,
			remainingCount: ackPendingNodeActions(trimmedNodeId, ackIds).length
		}, void 0);
	},
	"node.invoke": async ({ params, respond, context, client, req }) => {
		if (!require_src.validateNodeInvokeParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.invoke",
				validator: require_src.validateNodeInvokeParams
			});
			return;
		}
		const p = params;
		const nodeId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.nodeId) ?? "";
		const command = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.command) ?? "";
		const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(p.sessionKey);
		if (!nodeId || !command) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "nodeId and command required"));
			return;
		}
		if (command === "system.execApprovals.get" || command === "system.execApprovals.set") {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "node.invoke does not allow system.execApprovals.*; use exec.approvals.node.*", { details: { command } }));
			return;
		}
		if (nodeInvokePolicy.rejectClaudeAgentRun(command, respond)) return;
		if (command === "browser.proxy" && isForbiddenBrowserProxyMutation(p.params)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, "node.invoke cannot mutate persistent browser profiles via browser.proxy", { details: { command } }));
			return;
		}
		if (ADMIN_ONLY_NODE_INVOKE_COMMANDS.has(command) && !nodeInvokePolicy.clientHasOperatorAdminScope(client)) {
			respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, `missing scope: ${require_operator_scopes.ADMIN_SCOPE}`));
			return;
		}
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const cfg = context.getRuntimeConfig();
			let nodeSession = context.nodeRegistry.get(nodeId);
			if (!nodeSession) {
				const wakeReqId = req.id;
				const wakeFlowStartedAtMs = Date.now();
				context.logGateway.info(`node wake start node=${nodeId} req=${wakeReqId} command=${command}`);
				const wake = await maybeWakeNodeWithApns(nodeId, { cfg });
				context.logGateway.info(`node wake stage=wake1 node=${nodeId} req=${wakeReqId} available=${wake.available} throttled=${wake.throttled} path=${wake.path} durationMs=${wake.durationMs} apnsStatus=${wake.apnsStatus ?? -1} apnsReason=${wake.apnsReason ?? "-"}`);
				if (wake.available) {
					const waitStartedAtMs = Date.now();
					const waitTimeoutMs = require_nodes_wake_state.NODE_WAKE_RECONNECT_WAIT_MS;
					const reconnected = await waitForNodeReconnect({
						nodeId,
						context,
						timeoutMs: waitTimeoutMs
					});
					const waitDurationMs = Math.max(0, Date.now() - waitStartedAtMs);
					context.logGateway.info(`node wake stage=wait1 node=${nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${waitTimeoutMs} durationMs=${waitDurationMs}`);
				}
				nodeSession = context.nodeRegistry.get(nodeId);
				if (!nodeSession && wake.available) {
					const retryWake = await maybeWakeNodeWithApns(nodeId, {
						force: true,
						cfg
					});
					context.logGateway.info(`node wake stage=wake2 node=${nodeId} req=${wakeReqId} force=true available=${retryWake.available} throttled=${retryWake.throttled} path=${retryWake.path} durationMs=${retryWake.durationMs} apnsStatus=${retryWake.apnsStatus ?? -1} apnsReason=${retryWake.apnsReason ?? "-"}`);
					if (retryWake.available) {
						const waitStartedAtMs = Date.now();
						const waitTimeoutMs = require_nodes_wake_state.NODE_WAKE_RECONNECT_RETRY_WAIT_MS;
						const reconnected = await waitForNodeReconnect({
							nodeId,
							context,
							timeoutMs: waitTimeoutMs
						});
						const waitDurationMs = Math.max(0, Date.now() - waitStartedAtMs);
						context.logGateway.info(`node wake stage=wait2 node=${nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${waitTimeoutMs} durationMs=${waitDurationMs}`);
					}
					nodeSession = context.nodeRegistry.get(nodeId);
				}
				if (!nodeSession) {
					const totalDurationMs = Math.max(0, Date.now() - wakeFlowStartedAtMs);
					const nudge = await maybeSendNodeWakeNudge(nodeId, { cfg });
					context.logGateway.info(`node wake nudge node=${nodeId} req=${wakeReqId} sent=${nudge.sent} throttled=${nudge.throttled} reason=${nudge.reason} durationMs=${nudge.durationMs} apnsStatus=${nudge.apnsStatus ?? -1} apnsReason=${nudge.apnsReason ?? "-"}`);
					context.logGateway.warn(`node wake done node=${nodeId} req=${wakeReqId} connected=false reason=not_connected totalMs=${totalDurationMs}`);
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "node not connected", { details: { code: "NOT_CONNECTED" } }));
					return;
				}
				const totalDurationMs = Math.max(0, Date.now() - wakeFlowStartedAtMs);
				context.logGateway.info(`node wake done node=${nodeId} req=${wakeReqId} connected=true totalMs=${totalDurationMs}`);
			}
			for (const authorizationCfg of [cfg, context.getRuntimeConfig()]) {
				const allowlist = require_node_command_policy.resolveNodeCommandAllowlist(authorizationCfg, {
					...nodeSession,
					approvedCommands: nodeSession.commands
				});
				const allowed = require_node_command_policy.isNodeCommandAllowed({
					command,
					declaredCommands: nodeSession.commands,
					allowlist
				});
				if (!allowed.ok) {
					const hint = buildNodeCommandRejectionHint(allowed.reason, command, nodeSession, authorizationCfg);
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, hint, { details: {
						reason: allowed.reason,
						command
					} }));
					return;
				}
			}
			const forwardedParams = sanitizeNodeInvokeParamsForForwarding({
				nodeId,
				command,
				rawParams: p.params,
				client,
				execApprovalManager: context.execApprovalManager
			});
			if (!forwardedParams.ok) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, forwardedParams.message, { details: forwardedParams.details ?? null }));
				return;
			}
			const policyResult = await require_node_invoke_plugin_policy.applyPluginNodeInvokePolicy({
				context,
				client,
				nodeSession,
				command,
				params: forwardedParams.params,
				turnSource: {
					channel: p.turnSourceChannel,
					to: p.turnSourceTo,
					accountId: p.turnSourceAccountId,
					threadId: p.turnSourceThreadId
				},
				timeoutMs: p.timeoutMs,
				idempotencyKey: p.idempotencyKey
			});
			if (policyResult) {
				if (!policyResult.ok) {
					respond(false, void 0, require_error_codes.errorShape(policyResult.unavailable ? require_error_codes.ErrorCodes.UNAVAILABLE : require_error_codes.ErrorCodes.INVALID_REQUEST, policyResult.message, { details: {
						...policyResult.details,
						...policyResult.code ? { code: policyResult.code } : {}
					} }));
					return;
				}
				const payload = policyResult.payloadJSON ? require_nodes_helpers.safeParseJson(policyResult.payloadJSON) : policyResult.payload;
				emitTalkPttNodeEvent({
					context,
					nodeId,
					command,
					payload
				});
				respond(true, {
					ok: true,
					nodeId,
					command,
					payload: policyResult.payload,
					payloadJSON: policyResult.payloadJSON ?? null
				}, void 0);
				return;
			}
			const dispatchSession = context.nodeRegistry.get(nodeId);
			if (!dispatchSession || dispatchSession.connId !== nodeSession.connId) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "node connection changed before dispatch", {
					retryable: true,
					details: { code: "ROUTE_CHANGED" }
				}));
				return;
			}
			const dispatchCfg = context.getRuntimeConfig();
			const dispatchAllowlist = require_node_command_policy.resolveNodeCommandAllowlist(dispatchCfg, {
				...dispatchSession,
				approvedCommands: dispatchSession.commands
			});
			const dispatchAllowed = require_node_command_policy.isNodeCommandAllowed({
				command,
				declaredCommands: dispatchSession.commands,
				allowlist: dispatchAllowlist
			});
			if (!dispatchAllowed.ok) {
				respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, buildNodeCommandRejectionHint(dispatchAllowed.reason, command, dispatchSession, dispatchCfg), { details: {
					reason: dispatchAllowed.reason,
					command
				} }));
				return;
			}
			const res = await context.nodeRegistry.invoke({
				nodeId,
				expectedConnId: nodeSession.connId,
				command,
				params: forwardedParams.params,
				timeoutMs: p.timeoutMs,
				idempotencyKey: p.idempotencyKey,
				...sessionKey ? { sessionKey } : {}
			});
			if (!res.ok) {
				if (shouldQueueAsPendingForegroundAction({
					platform: nodeSession.platform,
					command,
					error: res.error
				})) {
					const paramsJSON = toPendingParamsJSON(forwardedParams.params);
					const queued = enqueuePendingNodeAction({
						nodeId,
						command,
						paramsJSON,
						idempotencyKey: p.idempotencyKey
					});
					const wake = await maybeWakeNodeWithApns(nodeId, { cfg });
					context.logGateway.info(`node pending queued node=${nodeId} req=${req.id} command=${command} queuedId=${queued.id} wakePath=${wake.path} wakeAvailable=${wake.available}`);
					respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.UNAVAILABLE, "node command queued until iOS returns to foreground", {
						retryable: true,
						details: {
							code: "QUEUED_UNTIL_FOREGROUND",
							queuedActionId: queued.id,
							nodeId,
							command,
							wake: {
								path: wake.path,
								available: wake.available,
								throttled: wake.throttled,
								apnsStatus: wake.apnsStatus,
								apnsReason: wake.apnsReason
							},
							nodeError: res.error ?? null
						}
					}));
					return;
				}
				if (!require_nodes_helpers.respondUnavailableOnNodeInvokeError(respond, res)) return;
				return;
			}
			const payload = res.payloadJSON ? require_nodes_helpers.safeParseJson(res.payloadJSON) : res.payload;
			emitTalkPttNodeEvent({
				context,
				nodeId,
				command,
				payload
			});
			respond(true, {
				ok: true,
				nodeId,
				command,
				payload,
				payloadJSON: res.payloadJSON ?? null
			}, void 0);
		});
	},
	"node.invoke.progress": handleNodeInvokeProgress,
	"node.invoke.result": handleNodeInvokeResult,
	"node.event": async ({ params, respond, context, client }) => {
		if (!require_src.validateNodeEventParams(params)) {
			require_nodes_helpers.respondInvalidParams({
				respond,
				method: "node.event",
				validator: require_src.validateNodeEventParams
			});
			return;
		}
		const p = params;
		const payloadJSON = typeof p.payloadJSON === "string" ? p.payloadJSON : p.payload !== void 0 ? JSON.stringify(p.payload) : null;
		await require_nodes_helpers.respondUnavailableOnThrow(respond, async () => {
			const { handleNodeEvent } = await Promise.resolve().then(() => require("./server-node-events-BvOFQSX3.cjs"));
			const nodeId = client?.connect?.device?.id ?? client?.connect?.client?.id ?? "node";
			const nodeSession = context.nodeRegistry.get(nodeId);
			const presenceAllowed = nodeSession !== void 0 && nodeSession.connId === client?.connId && nodeSession.permissions?.accessibility === true;
			respond(true, await handleNodeEvent({
				deps: context.deps,
				broadcast: context.broadcast,
				nodeSendToSession: context.nodeSendToSession,
				nodeSubscribe: context.nodeSubscribe,
				nodeUnsubscribe: context.nodeUnsubscribe,
				broadcastVoiceWakeChanged: context.broadcastVoiceWakeChanged,
				addChatRun: context.addChatRun,
				removeChatRun: context.removeChatRun,
				chatAbortControllers: context.chatAbortControllers,
				chatAbortedRuns: context.chatAbortedRuns,
				chatRunBuffers: context.chatRunBuffers,
				chatDeltaSentAt: context.chatDeltaSentAt,
				dedupe: context.dedupe,
				agentRunSeq: context.agentRunSeq,
				getHealthCache: context.getHealthCache,
				refreshHealthSnapshot: context.refreshHealthSnapshot,
				loadGatewayModelCatalog: context.loadGatewayModelCatalog,
				authorizeNodeSystemRunEvent: (eventParams) => context.nodeRegistry.authorizeSystemRunEvent({
					nodeId: eventParams.nodeId,
					connId: eventParams.connId,
					runId: eventParams.runId,
					sessionKey: eventParams.sessionKey,
					terminal: eventParams.terminal
				}),
				updateNodePresenceActivity: (activity) => {
					const updated = context.nodeRegistry.updatePresenceActivity(activity);
					return updated?.lastActiveAtMs !== void 0 && updated.presenceUpdatedAtMs !== void 0 ? {
						lastActiveAtMs: updated.lastActiveAtMs,
						presenceUpdatedAtMs: updated.presenceUpdatedAtMs
					} : null;
				},
				logGateway: { warn: context.logGateway.warn }
			}, nodeId, {
				event: p.event,
				payloadJSON
			}, {
				connId: client?.connId,
				deviceId: client?.connect?.device?.id,
				presenceAllowed
			}) ?? { ok: true }, void 0);
		});
	}
};
//#endregion
exports.NODE_WAKE_RECONNECT_RETRY_WAIT_MS = require_nodes_wake_state.NODE_WAKE_RECONNECT_RETRY_WAIT_MS;
exports.NODE_WAKE_RECONNECT_WAIT_MS = require_nodes_wake_state.NODE_WAKE_RECONNECT_WAIT_MS;
exports.clearNodeWakeState = require_nodes_wake_state.clearNodeWakeState;
exports.maybeSendNodeWakeNudge = maybeSendNodeWakeNudge;
exports.maybeWakeNodeWithApns = maybeWakeNodeWithApns;
exports.nodeHandlers = nodeHandlers;
exports.waitForNodeReconnect = waitForNodeReconnect;
