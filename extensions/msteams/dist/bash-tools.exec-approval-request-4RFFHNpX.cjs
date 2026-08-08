const require_lazy_promise = require("./lazy-promise-D88D0uwq.cjs");
const require_shell_wrapper_resolution = require("./shell-wrapper-resolution-DAYpyVkb.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_bash_tools_exec_runtime = require("./bash-tools.exec-runtime-Bs5anBBF.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/bash-tools.exec-approval-request.ts
/**
* Exec approval request client.
* Registers two-phase approval requests with the gateway, waits for decisions,
* and builds host/node payloads with optional command highlighting.
*/
const POSIX_COMMAND_HIGHLIGHT_SHELLS = require_shell_wrapper_resolution.POSIX_SHELL_WRAPPERS;
const loadExecApprovalCommandSpansRuntime = require_lazy_promise.createLazyPromise(() => Promise.resolve().then(() => require("./bash-tools.exec-approval-request.runtime-DJsw5zB3.cjs")), { cacheRejections: true });
function buildExecApprovalRequestToolParams(params) {
	return {
		id: params.id,
		...params.command ? { command: params.command } : {},
		...params.commandArgv ? { commandArgv: params.commandArgv } : {},
		systemRunPlan: params.systemRunPlan,
		env: params.env,
		cwd: params.cwd,
		nodeId: params.nodeId,
		host: params.host,
		security: params.security,
		ask: params.ask,
		warningText: params.warningText,
		commandSpans: params.commandSpans,
		...params.unavailableDecisions?.length ? { unavailableDecisions: params.unavailableDecisions } : {},
		agentId: params.agentId,
		resolvedPath: params.resolvedPath,
		sessionKey: params.sessionKey,
		turnSourceChannel: params.turnSourceChannel,
		turnSourceTo: params.turnSourceTo,
		turnSourceAccountId: params.turnSourceAccountId,
		turnSourceThreadId: params.turnSourceThreadId,
		approvalReviewerDeviceIds: params.approvalReviewerDeviceIds,
		requireDeliveryRoute: params.requireDeliveryRoute,
		suppressDelivery: params.suppressDelivery,
		timeoutMs: require_bash_tools_exec_runtime.DEFAULT_APPROVAL_TIMEOUT_MS,
		twoPhase: true
	};
}
function parseDecision(value) {
	if (!value || typeof value !== "object") return {
		present: false,
		value: null
	};
	if (!Object.hasOwn(value, "decision")) return {
		present: false,
		value: null
	};
	const decision = value.decision;
	return {
		present: true,
		value: typeof decision === "string" ? decision : null
	};
}
function parseExpiresAtMs(value) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(value);
}
function resolveDefaultExecApprovalExpiresAtMs() {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(require_bash_tools_exec_runtime.DEFAULT_APPROVAL_TIMEOUT_MS) ?? 0;
}
/** Registers a two-phase exec approval request with the gateway. */
async function registerExecApprovalRequest(params) {
	const registrationResult = await require_gateway.callGatewayTool("exec.approval.request", { timeoutMs: require_bash_tools_exec_runtime.DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS }, buildExecApprovalRequestToolParams(params), { expectFinal: false });
	const decision = parseDecision(registrationResult);
	const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(registrationResult?.id) ?? params.id;
	const expiresAtMs = parseExpiresAtMs(registrationResult?.expiresAtMs) ?? resolveDefaultExecApprovalExpiresAtMs();
	if (decision.present) return {
		id,
		expiresAtMs,
		finalDecision: decision.value
	};
	return {
		id,
		expiresAtMs
	};
}
/** Uses a pre-resolved decision or waits for the registered approval id. */
async function resolveRegisteredExecApprovalDecision(params) {
	if (params.preResolvedDecision !== void 0) return params.preResolvedDecision ?? null;
	try {
		return parseDecision(await require_gateway.callGatewayTool("exec.approval.waitDecision", { timeoutMs: require_bash_tools_exec_runtime.DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS }, { id: params.approvalId })).value;
	} catch (err) {
		if ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(String(err)).includes("approval expired or not found")) return null;
		throw err;
	}
}
/** Builds requester identity context for an approval payload. */
function buildExecApprovalRequesterContext(params) {
	return {
		agentId: params.agentId,
		sessionKey: params.sessionKey
	};
}
/** Builds originating channel context for approval delivery/routing. */
function buildExecApprovalTurnSourceContext(params) {
	return {
		turnSourceChannel: params.turnSourceChannel,
		turnSourceTo: params.turnSourceTo,
		turnSourceAccountId: params.turnSourceAccountId,
		turnSourceThreadId: params.turnSourceThreadId
	};
}
async function resolveCommandSpans(command) {
	if (!command) return;
	try {
		const { resolveExecApprovalCommandSpans } = await loadExecApprovalCommandSpansRuntime();
		return await resolveExecApprovalCommandSpans(command);
	} catch {
		return;
	}
}
function hasUnsupportedShellArgv(argv) {
	if (!argv?.length) return false;
	const executable = (require_shell_wrapper_resolution.resolveShellWrapperTransportArgv([...argv]) ?? argv)[0];
	if (!executable) return false;
	const normalizedExecutable = require_shell_wrapper_resolution.normalizeExecutableToken(executable);
	return require_shell_wrapper_resolution.isShellWrapperExecutable(normalizedExecutable) && !POSIX_COMMAND_HIGHLIGHT_SHELLS.has(normalizedExecutable);
}
function shouldSkipGeneratedCommandSpans(params) {
	if (params.host === "gateway" && process.platform === "win32") return true;
	return hasUnsupportedShellArgv(params.commandArgv?.length ? params.commandArgv : params.systemRunPlan?.argv);
}
async function buildHostApprovalDecisionParams(params) {
	const commandSpans = params.commandHighlighting === true ? params.commandSpans ?? (shouldSkipGeneratedCommandSpans(params) ? void 0 : await resolveCommandSpans(params.command ?? params.systemRunPlan?.commandText)) : void 0;
	return {
		id: params.approvalId,
		command: params.command,
		commandArgv: params.commandArgv,
		systemRunPlan: params.systemRunPlan,
		env: params.env,
		cwd: params.workdir,
		nodeId: params.nodeId,
		host: params.host,
		security: params.security,
		ask: params.ask,
		warningText: params.warningText,
		commandSpans,
		unavailableDecisions: params.unavailableDecisions,
		...buildExecApprovalRequesterContext({
			agentId: params.agentId,
			sessionKey: params.sessionKey
		}),
		resolvedPath: params.resolvedPath,
		requireDeliveryRoute: params.requireDeliveryRoute,
		suppressDelivery: params.suppressDelivery,
		approvalReviewerDeviceIds: params.approvalReviewerDeviceIds,
		...buildExecApprovalTurnSourceContext(params)
	};
}
/** Registers a host/node approval request without waiting for a decision. */
async function registerExecApprovalRequestForHost(params) {
	return await registerExecApprovalRequest(await buildHostApprovalDecisionParams(params));
}
/** Registers a host/node approval request and wraps failures for exec callers. */
async function registerExecApprovalRequestForHostOrThrow(params) {
	try {
		return await registerExecApprovalRequestForHost(params);
	} catch (err) {
		throw new Error(`Exec approval registration failed: ${String(err)}`, { cause: err });
	}
}
//#endregion
Object.defineProperty(exports, "buildExecApprovalRequesterContext", {
	enumerable: true,
	get: function() {
		return buildExecApprovalRequesterContext;
	}
});
Object.defineProperty(exports, "buildExecApprovalTurnSourceContext", {
	enumerable: true,
	get: function() {
		return buildExecApprovalTurnSourceContext;
	}
});
Object.defineProperty(exports, "registerExecApprovalRequestForHostOrThrow", {
	enumerable: true,
	get: function() {
		return registerExecApprovalRequestForHostOrThrow;
	}
});
Object.defineProperty(exports, "resolveRegisteredExecApprovalDecision", {
	enumerable: true,
	get: function() {
		return resolveRegisteredExecApprovalDecision;
	}
});
