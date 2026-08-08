const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_hook_helpers = require("./hook-helpers-B7eHTW1w.cjs");
require("./types-lecpXEXr.cjs");
require("./errors-BqS4bzom.cjs");
const require_common = require("./common-lfuK3YJR.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_stable_stringify = require("./stable-stringify-WjfDEBwS.cjs");
require("./hook-runner-global-De_h3eqM.cjs");
require("./private-file-store-C0DdQCy-.cjs");
const require_agent_tool_result_middleware = require("./agent-tool-result-middleware-Do5BE8dK.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_error_codes = require("./error-codes-tCbcI3fz.cjs");
require("./tool-loop-detection-config-c-3qUtKe.cjs");
require("./src-Bh1Dm1hT.cjs");
const require_lifecycle_hook_helpers = require("./lifecycle-hook-helpers-QUNXi5sC.cjs");
const require_tool_result_middleware = require("./tool-result-middleware-mi_yoCjU.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_crypto = require("node:crypto");
require("node:http");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/agents/harness/native-hook-relay.ts
/**
* Bridges native harness hook events through registered relay processes.
*/
const DEFAULT_PERMISSION_TIMEOUT_MS = 12e4;
const PERMISSION_ALLOW_ALWAYS_TTL_MS = 1800 * 1e3;
const MAX_NATIVE_HOOK_RELAY_INVOCATIONS = 200;
const MAX_NATIVE_HOOK_RELAY_JSON_DEPTH = 64;
const MAX_NATIVE_HOOK_RELAY_JSON_NODES = 2e4;
const MAX_NATIVE_HOOK_RELAY_STRING_LENGTH = 1e6;
const MAX_NATIVE_HOOK_RELAY_TOTAL_STRING_LENGTH = 4e6;
const MAX_NATIVE_HOOK_RELAY_HISTORY_STRING_LENGTH = 4e3;
const MAX_NATIVE_HOOK_RELAY_HISTORY_TOTAL_STRING_LENGTH = 2e4;
const MAX_NATIVE_HOOK_RELAY_HISTORY_ARRAY_ITEMS = 50;
const MAX_NATIVE_HOOK_RELAY_HISTORY_OBJECT_KEYS = 50;
const MAX_PERMISSION_FALLBACK_KEYS = 200;
const MAX_PERMISSION_FALLBACK_KEY_CHARS = 240;
const MAX_PERMISSION_FINGERPRINT_SORT_KEYS = 200;
const MAX_APPROVAL_TITLE_LENGTH = 80;
const MAX_APPROVAL_DESCRIPTION_LENGTH = 700;
const MAX_PERMISSION_APPROVALS_PER_WINDOW = 12;
const PERMISSION_APPROVAL_WINDOW_MS = 6e4;
const MAX_PERMISSION_ALLOW_ALWAYS_ENTRIES = 512;
const NATIVE_HOOK_RELAY_BRIDGE_STALE_REGISTRATION_ERROR = "native hook relay bridge stale registration";
const log = require_subsystem.createSubsystemLogger("agents/harness/native-hook-relay");
const NATIVE_HOOK_RELAY_STATE_SYMBOL = Symbol.for("operator.nativeHookRelay.state");
function getNativeHookRelaySharedState() {
	const globalRecord = globalThis;
	globalRecord[NATIVE_HOOK_RELAY_STATE_SYMBOL] ??= {
		relays: /* @__PURE__ */ new Map(),
		relayBridges: /* @__PURE__ */ new Map(),
		invocations: [],
		pendingPermissionApprovals: /* @__PURE__ */ new Map(),
		pendingPreToolUseApprovals: /* @__PURE__ */ new Map(),
		permissionApprovalWindows: /* @__PURE__ */ new Map(),
		permissionAllowAlwaysApprovals: /* @__PURE__ */ new Map()
	};
	return globalRecord[NATIVE_HOOK_RELAY_STATE_SYMBOL];
}
const nativeHookRelayState = getNativeHookRelaySharedState();
const relays = nativeHookRelayState.relays;
const relayBridges = nativeHookRelayState.relayBridges;
const invocations = nativeHookRelayState.invocations;
const pendingPermissionApprovals = nativeHookRelayState.pendingPermissionApprovals;
const pendingPreToolUseApprovals = nativeHookRelayState.pendingPreToolUseApprovals;
const permissionApprovalWindows = nativeHookRelayState.permissionApprovalWindows;
const permissionAllowAlwaysApprovals = nativeHookRelayState.permissionAllowAlwaysApprovals;
let nativeHookRelayPermissionApprovalRequester = requestNativeHookRelayPermissionApproval;
const NATIVE_HOOK_TOOL_NAME_ALIASES = { exec_command: "exec" };
const nativeHookRelayProviderAdapters = { codex: {
	normalizeMetadata: normalizeCodexHookMetadata,
	readToolInput: readCodexToolInput,
	readToolResponse: readCodexToolResponse,
	renderNoopResponse: () => {
		return {
			stdout: "",
			stderr: "",
			exitCode: 0
		};
	},
	renderPreToolUseBlockResponse: (reason, failureDisposition) => ({
		stdout: `${JSON.stringify({ hookSpecificOutput: {
			hookEventName: "PreToolUse",
			permissionDecision: "deny",
			permissionDecisionReason: reason
		} })}\n`,
		stderr: "",
		exitCode: 0,
		...failureDisposition ? { failureDisposition } : {}
	}),
	renderBeforeAgentFinalizeReviseResponse: (reason) => ({
		stdout: `${JSON.stringify({
			decision: "block",
			reason
		})}\n`,
		stderr: "",
		exitCode: 0
	}),
	renderBeforeAgentFinalizeStopResponse: (reason) => ({
		stdout: `${JSON.stringify({
			continue: false,
			...reason?.trim() ? { stopReason: reason.trim() } : {}
		})}\n`,
		stderr: "",
		exitCode: 0
	}),
	renderPermissionDecisionResponse: (decision, message) => ({
		stdout: `${JSON.stringify({ hookSpecificOutput: {
			hookEventName: "PermissionRequest",
			decision: decision === "allow" ? { behavior: "allow" } : {
				behavior: "deny",
				message: message?.trim() || "Denied by Operator"
			}
		} })}\n`,
		stderr: "",
		exitCode: 0
	})
} };
function unregisterNativeHookRelay(relayId, expectedRegistration) {
	if (expectedRegistration && relays.get(relayId) !== expectedRegistration) return;
	unregisterNativeHookRelayBridge(relayId);
	relays.delete(relayId);
	removeNativeHookRelayInvocations(relayId);
	removeNativeHookRelayPreToolUseApprovals(relayId);
	removeNativeHookRelayPermissionState(relayId);
}
async function invokeNativeHookRelay(params) {
	const provider = readNativeHookRelayProvider(params.provider);
	const relayId = readNonEmptyString(params.relayId, "relayId");
	const event = readNativeHookRelayEvent(params.event);
	const registration = relays.get(relayId);
	if (!registration) {
		pruneExpiredNativeHookRelays();
		throw new Error("native hook relay not found");
	}
	if (Date.now() > registration.expiresAtMs) {
		unregisterNativeHookRelay(relayId, registration);
		throw new Error("native hook relay expired");
	}
	if (registration.provider !== provider) throw new Error("native hook relay provider mismatch");
	if (params.requireGeneration) {
		const generation = readNonEmptyString(params.generation, "generation");
		if (generation !== registration.generation) {
			if (!canAcceptNativeHookRelayGenerationMismatch(registration, generation)) throw new Error(NATIVE_HOOK_RELAY_BRIDGE_STALE_REGISTRATION_ERROR);
			log.debug("native hook relay accepted bootstrap generation mismatch", {
				relayId,
				event,
				runId: registration.runId
			});
		}
	}
	if (!registration.allowedEvents.includes(event)) throw new Error("native hook relay event not allowed");
	if (!isJsonValue(params.rawPayload)) throw new Error("native hook relay payload must be JSON-compatible");
	const normalized = normalizeNativeHookInvocation({
		registration,
		event,
		rawPayload: params.rawPayload
	});
	recordNativeHookRelayInvocation(normalized);
	const startedAt = Date.now();
	const response = await processNativeHookRelayInvocation({
		registration,
		invocation: normalized,
		adapter: getNativeHookRelayProviderAdapter(provider)
	});
	if (normalized.toolUseId && response.failureDisposition && readNativeHookRelayApprovalMode(normalized.rawPayload) !== "report") projectNativeHookRelayPreToolUseFailure(registration, {
		toolName: normalizeNativeHookToolName(normalized.toolName),
		toolCallId: normalized.toolUseId,
		disposition: response.failureDisposition,
		durationMs: Date.now() - startedAt
	});
	return response;
}
function projectNativeHookRelayPreToolUseFailure(registration, failure) {
	const callback = registration.onPreToolUseFailure;
	if (!callback) return;
	if (registration.preToolUseFailureProjections.has(failure.toolCallId)) return;
	const record = {
		promise: Promise.resolve().then(() => callback(failure)),
		settled: false
	};
	registration.preToolUseFailureProjections.set(failure.toolCallId, record);
	record.promise.then(() => {
		record.settled = true;
	}, (error) => {
		record.settled = true;
		if (registration.preToolUseFailureProjections.get(failure.toolCallId) === record) registration.preToolUseFailureProjections.delete(failure.toolCallId);
		log.debug("native pre-tool failure projection failed", {
			error,
			relayId: registration.relayId,
			toolCallId: failure.toolCallId
		});
	});
	if (registration.preToolUseFailureProjections.size > MAX_NATIVE_HOOK_RELAY_INVOCATIONS) {
		let oldestToolCallId;
		for (const [toolCallId, candidate] of registration.preToolUseFailureProjections) {
			oldestToolCallId ??= toolCallId;
			if (candidate.settled) {
				registration.preToolUseFailureProjections.delete(toolCallId);
				return;
			}
		}
		if (oldestToolCallId) registration.preToolUseFailureProjections.delete(oldestToolCallId);
	}
}
function recordNativeHookRelayInvocation(invocation) {
	invocations.push({
		...invocation,
		rawPayload: snapshotNativeHookRelayPayload(invocation.rawPayload)
	});
	if (invocations.length > MAX_NATIVE_HOOK_RELAY_INVOCATIONS) invocations.splice(0, invocations.length - MAX_NATIVE_HOOK_RELAY_INVOCATIONS);
}
function removeNativeHookRelayInvocations(relayId) {
	for (let index = invocations.length - 1; index >= 0; index -= 1) if (invocations[index]?.relayId === relayId) invocations.splice(index, 1);
}
function canAcceptNativeHookRelayGenerationMismatch(registration, generation) {
	const expiresAtMs = registration.generationMismatchGraceExpiresAtMs;
	if (typeof expiresAtMs !== "number" || Date.now() > expiresAtMs) return false;
	if (registration.generationMismatchGraceAcceptedGeneration) return registration.generationMismatchGraceAcceptedGeneration === generation;
	registration.generationMismatchGraceAcceptedGeneration = generation;
	return true;
}
function nativeHookRelayPreToolUseApprovalKey(params) {
	const toolUseId = params.toolUseId?.trim();
	return toolUseId ? `${params.relayId}:${toolUseId}` : void 0;
}
function setNativeHookRelayPreToolUseApproval(params) {
	const key = nativeHookRelayPreToolUseApprovalKey(params);
	if (!key) return false;
	const previousApproval = pendingPreToolUseApprovals.get(key);
	if (previousApproval) require_hook_helpers.cancelDeferredPluginToolApproval(previousApproval.deferredApproval);
	pendingPreToolUseApprovals.set(key, {
		deferredApproval: params.deferredApproval,
		originalParamsFingerprint: params.originalParamsFingerprint
	});
	if (pendingPreToolUseApprovals.size > MAX_NATIVE_HOOK_RELAY_INVOCATIONS) {
		const oldestKey = pendingPreToolUseApprovals.keys().next().value;
		if (oldestKey) {
			const oldestApproval = pendingPreToolUseApprovals.get(oldestKey);
			if (oldestApproval) require_hook_helpers.cancelDeferredPluginToolApproval(oldestApproval.deferredApproval);
			pendingPreToolUseApprovals.delete(oldestKey);
		}
	}
	return true;
}
function removeNativeHookRelayPreToolUseApprovals(relayId) {
	const prefix = `${relayId}:`;
	for (const [key, pendingApproval] of pendingPreToolUseApprovals) if (key.startsWith(prefix)) {
		require_hook_helpers.cancelDeferredPluginToolApproval(pendingApproval.deferredApproval);
		pendingPreToolUseApprovals.delete(key);
	}
}
function pruneExpiredNativeHookRelays(now = Date.now()) {
	for (const [relayId, registration] of relays) if (now > registration.expiresAtMs) unregisterNativeHookRelay(relayId, registration);
}
function unregisterNativeHookRelayBridge(relayId, options) {
	const bridge = relayBridges.get(relayId);
	if (!bridge) return;
	relayBridges.delete(relayId);
	bridge.server.close();
	if (readNativeHookRelayBridgeRecordIfExists(relayId)?.token === bridge.token) {
		const deferRegistryRemovalMs = normalizePositiveInteger(options?.deferRegistryRemovalMs, 0);
		if (deferRegistryRemovalMs > 0) {
			setTimeout(() => {
				if (readNativeHookRelayBridgeRecordIfExists(relayId)?.token === bridge.token) (0, node_fs.rmSync)(bridge.registryPath, { force: true });
			}, deferRegistryRemovalMs).unref();
			return;
		}
		(0, node_fs.rmSync)(bridge.registryPath, { force: true });
	}
}
function readNativeHookRelayBridgeRecordIfExists(relayId) {
	const registryPath = nativeHookRelayBridgeRegistryPath(relayId);
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)(registryPath, "utf8"));
		if (isNativeHookRelayBridgeRecord(parsed, relayId)) return parsed;
	} catch (error) {
		if (error.code !== "ENOENT") log.debug("failed to read native hook relay bridge registry", {
			error,
			relayId
		});
	}
}
function isNativeHookRelayBridgeRecord(value, relayId) {
	return isJsonObject(value) && value.version === 1 && value.relayId === relayId && typeof value.pid === "number" && Number.isInteger(value.pid) && value.hostname === "127.0.0.1" && typeof value.port === "number" && Number.isInteger(value.port) && value.port > 0 && value.port <= 65535 && typeof value.token === "string" && value.token.length > 0 && typeof value.expiresAtMs === "number";
}
function nativeHookRelayBridgeDir() {
	const uid = typeof process.getuid === "function" ? process.getuid() : "nouid";
	return node_path.default.join((0, node_os.tmpdir)(), `operator-native-hook-relays-${uid}`);
}
function nativeHookRelayBridgeRegistryPath(relayId) {
	return node_path.default.join(nativeHookRelayBridgeDir(), `${nativeHookRelayBridgeKey(relayId)}.json`);
}
function nativeHookRelayBridgeKey(relayId) {
	return (0, node_crypto.createHash)("sha256").update(relayId).digest("hex").slice(0, 32);
}
async function processNativeHookRelayInvocation(params) {
	if (params.invocation.event === "pre_tool_use") return runNativeHookRelayPreToolUse(params);
	if (params.invocation.event === "post_tool_use") return runNativeHookRelayPostToolUse(params);
	if (params.invocation.event === "before_agent_finalize") return runNativeHookRelayBeforeAgentFinalize(params);
	return runNativeHookRelayPermissionRequest(params);
}
async function runNativeHookRelayPreToolUse(params) {
	const toolName = normalizeNativeHookToolName(params.invocation.toolName);
	const toolInput = params.adapter.readToolInput(params.invocation.rawPayload);
	const originalToolInputFingerprint = require_stable_stringify.stableStringify(toolInput);
	const approvalMode = readNativeHookRelayApprovalMode(params.invocation.rawPayload);
	const outcome = await require_hook_helpers.runBeforeToolCallHook({
		toolName,
		params: toolInput,
		...params.invocation.toolUseId ? { toolCallId: params.invocation.toolUseId } : {},
		...approvalMode === "report" ? { approvalMode: "defer" } : {},
		signal: params.registration.signal,
		ctx: {
			...params.registration.agentId ? { agentId: params.registration.agentId } : {},
			sessionId: params.registration.sessionId,
			...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
			...params.registration.config ? { config: params.registration.config } : {},
			runId: params.registration.runId,
			...params.registration.channelId ? { channelId: params.registration.channelId } : {},
			...params.invocation.cwd ? {
				cwd: params.invocation.cwd,
				workspaceDir: params.invocation.cwd
			} : {}
		}
	});
	if (outcome.blocked) return params.adapter.renderPreToolUseBlockResponse(outcome.reason, outcome.kind === "failure" && outcome.disposition !== "blocked" ? outcome.disposition : void 0);
	if (outcome.deferredApproval) {
		if (!setNativeHookRelayPreToolUseApproval({
			relayId: params.registration.relayId,
			toolUseId: params.invocation.toolUseId,
			deferredApproval: outcome.deferredApproval,
			originalParamsFingerprint: originalToolInputFingerprint
		})) {
			require_hook_helpers.cancelDeferredPluginToolApproval(outcome.deferredApproval);
			return params.adapter.renderPreToolUseBlockResponse("Plugin approval required but Codex tool id unavailable.");
		}
		return params.adapter.renderNoopResponse(params.invocation.event);
	}
	if (nativeHookRelayParamsWereRewritten(originalToolInputFingerprint, outcome.params)) return params.adapter.renderPreToolUseBlockResponse("Operator tool policy rewrote Codex app-server approval params; refusing original request.");
	return params.adapter.renderNoopResponse(params.invocation.event);
}
async function runNativeHookRelayPostToolUse(params) {
	const toolName = normalizeNativeHookToolName(params.invocation.toolName);
	const toolCallId = params.invocation.toolUseId ?? `${params.invocation.event}:${params.invocation.receivedAt}`;
	const startArgs = params.adapter.readToolInput(params.invocation.rawPayload);
	const rawResult = params.adapter.readToolResponse(params.invocation.rawPayload);
	const result = !(require_agent_tool_result_middleware.listAgentToolResultMiddlewares("codex").length > 0) ? rawResult : await require_tool_result_middleware.createAgentToolResultMiddlewareRunner({
		runtime: "codex",
		...params.registration.agentId ? { agentId: params.registration.agentId } : {},
		sessionId: params.registration.sessionId,
		...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
		runId: params.registration.runId
	}).applyToolResultMiddleware({
		turnId: params.invocation.turnId,
		toolCallId,
		toolName,
		args: startArgs,
		...params.invocation.cwd ? { cwd: params.invocation.cwd } : {},
		result: require_common.payloadTextResult(rawResult)
	});
	await require_hook_helpers.runAgentHarnessAfterToolCallHook({
		toolName,
		toolCallId,
		runId: params.registration.runId,
		...params.registration.agentId ? { agentId: params.registration.agentId } : {},
		sessionId: params.registration.sessionId,
		...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
		...params.registration.channelId ? { channelId: params.registration.channelId } : {},
		startArgs,
		result
	});
	return params.adapter.renderNoopResponse(params.invocation.event);
}
async function runNativeHookRelayPermissionRequest(params) {
	const request = {
		provider: params.registration.provider,
		...params.registration.agentId ? { agentId: params.registration.agentId } : {},
		sessionId: params.registration.sessionId,
		...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
		runId: params.registration.runId,
		toolName: normalizeNativeHookToolName(params.invocation.toolName),
		...params.invocation.toolUseId ? { toolCallId: params.invocation.toolUseId } : {},
		...params.invocation.cwd ? { cwd: params.invocation.cwd } : {},
		...params.invocation.model ? { model: params.invocation.model } : {},
		toolInput: params.adapter.readToolInput(params.invocation.rawPayload),
		...params.registration.signal ? { signal: params.registration.signal } : {}
	};
	const approvalKey = nativeHookRelayPermissionApprovalKey({
		registration: params.registration,
		request
	});
	const allowAlwaysKey = nativeHookRelayPermissionAllowAlwaysKey({
		registration: params.registration,
		request
	});
	if (hasNativeHookRelayPermissionAllowAlways(allowAlwaysKey)) return params.adapter.renderPermissionDecisionResponse("allow");
	const pendingApproval = pendingPermissionApprovals.get(approvalKey);
	try {
		const decision = await (pendingApproval ?? startNativeHookRelayPermissionApprovalWithBudget({
			registration: params.registration,
			approvalKey,
			request
		}));
		if (decision === "allow") return params.adapter.renderPermissionDecisionResponse("allow");
		if (decision === "allow-always") {
			rememberNativeHookRelayPermissionAllowAlways(allowAlwaysKey);
			return params.adapter.renderPermissionDecisionResponse("allow");
		}
		if (decision === "deny") return params.adapter.renderPermissionDecisionResponse("deny", "Denied by user");
	} catch (error) {
		log.warn(`native hook permission approval failed; deferring to provider approval path: ${String(error)}`);
	}
	return params.adapter.renderNoopResponse(params.invocation.event);
}
async function runNativeHookRelayBeforeAgentFinalize(params) {
	const outcome = await require_lifecycle_hook_helpers.runAgentHarnessBeforeAgentFinalizeHook({
		event: {
			runId: params.registration.runId,
			sessionId: params.registration.sessionId,
			...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
			...params.invocation.turnId ? { turnId: params.invocation.turnId } : {},
			provider: params.registration.provider,
			...params.invocation.model ? { model: params.invocation.model } : {},
			...params.invocation.cwd ? { cwd: params.invocation.cwd } : {},
			...params.invocation.transcriptPath ? { transcriptPath: params.invocation.transcriptPath } : {},
			stopHookActive: params.invocation.stopHookActive === true,
			...params.invocation.lastAssistantMessage ? { lastAssistantMessage: params.invocation.lastAssistantMessage } : {}
		},
		ctx: {
			...params.registration.agentId ? { agentId: params.registration.agentId } : {},
			sessionId: params.registration.sessionId,
			...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
			runId: params.registration.runId,
			...params.registration.channelId ? { channelId: params.registration.channelId } : {},
			...params.invocation.cwd ? { workspaceDir: params.invocation.cwd } : {},
			...params.invocation.model ? { modelId: params.invocation.model } : {}
		}
	});
	if (outcome.action === "revise") return params.adapter.renderBeforeAgentFinalizeReviseResponse(outcome.reason);
	if (outcome.action === "finalize") return params.adapter.renderBeforeAgentFinalizeStopResponse(outcome.reason);
	return params.adapter.renderNoopResponse(params.invocation.event);
}
async function startNativeHookRelayPermissionApprovalWithBudget(params) {
	if (!consumeNativeHookRelayPermissionBudget(params.registration.relayId)) {
		log.warn(`native hook permission approval rate limit exceeded; deferring to provider approval path: relay=${params.registration.relayId} run=${params.registration.runId}`);
		return "defer";
	}
	const approval = nativeHookRelayPermissionApprovalRequester(params.request).finally(() => {
		if (pendingPermissionApprovals.get(params.approvalKey) === approval) pendingPermissionApprovals.delete(params.approvalKey);
	});
	pendingPermissionApprovals.set(params.approvalKey, approval);
	return approval;
}
function nativeHookRelayPermissionApprovalKey(params) {
	return [
		params.registration.relayId,
		params.registration.runId,
		params.request.toolCallId ? `call:${params.request.toolCallId}` : permissionRequestFallbackKey(params.request),
		permissionRequestContentFingerprint(params.request)
	].join(":");
}
function nativeHookRelayPermissionAllowAlwaysKey(params) {
	const hash = (0, node_crypto.createHash)("sha256");
	hash.update("operator:native-hook-relay:permission-allow-always:v2");
	hash.update("\0");
	hash.update(params.registration.relayId);
	hash.update("\0");
	hash.update(params.request.provider);
	hash.update("\0");
	hash.update(params.request.agentId ?? "");
	hash.update("\0");
	hash.update(params.request.sessionKey ?? params.request.sessionId);
	hash.update("\0");
	hash.update(permissionRequestContentFingerprint(params.request));
	return hash.digest("hex");
}
function permissionRequestFallbackKey(request) {
	const command = readOptionalString(request.toolInput.command);
	if (command) return `${request.toolName}:command:${truncateText(command, 240)}`;
	return `${request.toolName}:keys:${permissionRequestToolInputKeyFingerprint(request.toolInput)}`;
}
function permissionRequestToolInputKeyFingerprint(toolInput) {
	let fingerprint = "";
	const { keys, truncated } = readBoundedOwnKeys(toolInput, MAX_PERMISSION_FALLBACK_KEYS);
	for (const key of keys) {
		const separator = fingerprint ? "," : "";
		const remaining = MAX_PERMISSION_FALLBACK_KEY_CHARS - fingerprint.length - separator.length;
		if (remaining <= 0) break;
		fingerprint += `${separator}${key.slice(0, remaining)}`;
	}
	if (truncated && fingerprint.length < MAX_PERMISSION_FALLBACK_KEY_CHARS) fingerprint += `${fingerprint ? "," : ""}...`.slice(0, MAX_PERMISSION_FALLBACK_KEY_CHARS - fingerprint.length);
	return fingerprint || "none";
}
function permissionRequestContentFingerprint(request) {
	const hash = (0, node_crypto.createHash)("sha256");
	hash.update(request.toolName);
	hash.update("\0");
	hash.update(request.cwd ?? "");
	hash.update("\0");
	updateJsonHash(hash, request.toolInput);
	return hash.digest("hex");
}
function updateJsonHash(hash, value) {
	if (value === null) {
		hash.update("null");
		return;
	}
	if (typeof value === "string") {
		hash.update("string:");
		hash.update(JSON.stringify(value));
		return;
	}
	if (typeof value === "number") {
		hash.update(`number:${String(value)}`);
		return;
	}
	if (typeof value === "boolean") {
		hash.update(`boolean:${String(value)}`);
		return;
	}
	if (Array.isArray(value)) {
		hash.update("[");
		for (const item of value) {
			updateJsonHash(hash, item);
			hash.update(",");
		}
		hash.update("]");
		return;
	}
	hash.update("{");
	const { keys, truncated } = readBoundedOwnKeys(value, MAX_PERMISSION_FINGERPRINT_SORT_KEYS);
	for (const key of keys) {
		hash.update(JSON.stringify(key));
		hash.update(":");
		const item = value[key];
		if (item !== void 0) updateJsonHash(hash, item);
		hash.update(",");
	}
	if (truncated) {
		const sortedKeySet = new Set(keys);
		hash.update("#object-tail:");
		for (const key in value) {
			if (!Object.hasOwn(value, key) || sortedKeySet.has(key)) continue;
			hash.update(JSON.stringify(key));
			hash.update(":");
			const item = value[key];
			if (item !== void 0) updateJsonHash(hash, item);
			hash.update(",");
		}
	}
	hash.update("}");
}
function readBoundedOwnKeys(value, maxKeys) {
	const keys = [];
	let truncated = false;
	for (const key in value) {
		if (!Object.hasOwn(value, key)) continue;
		if (keys.length >= maxKeys) {
			truncated = true;
			break;
		}
		keys.push(key);
	}
	keys.sort();
	return {
		keys,
		truncated
	};
}
function consumeNativeHookRelayPermissionBudget(relayId, now = Date.now()) {
	const windowStart = now - PERMISSION_APPROVAL_WINDOW_MS;
	const timestamps = (permissionApprovalWindows.get(relayId) ?? []).filter((timestamp) => timestamp >= windowStart);
	if (timestamps.length >= MAX_PERMISSION_APPROVALS_PER_WINDOW) {
		permissionApprovalWindows.set(relayId, timestamps);
		return false;
	}
	timestamps.push(now);
	permissionApprovalWindows.set(relayId, timestamps);
	return true;
}
function hasNativeHookRelayPermissionAllowAlways(key, now = Date.now()) {
	const validNow = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(now);
	if (validNow === void 0) return false;
	const entry = permissionAllowAlwaysApprovals.get(key);
	if (!entry) return false;
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(entry.expiresAtMs);
	if (expiresAtMs === void 0 || expiresAtMs <= validNow) {
		permissionAllowAlwaysApprovals.delete(key);
		return false;
	}
	return true;
}
function rememberNativeHookRelayPermissionAllowAlways(key, now = Date.now()) {
	pruneNativeHookRelayPermissionAllowAlways(now);
	const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(PERMISSION_ALLOW_ALWAYS_TTL_MS, { nowMs: now });
	if (expiresAtMs === void 0) return;
	permissionAllowAlwaysApprovals.set(key, { expiresAtMs });
	while (permissionAllowAlwaysApprovals.size > MAX_PERMISSION_ALLOW_ALWAYS_ENTRIES) {
		const oldestKey = permissionAllowAlwaysApprovals.keys().next().value;
		if (typeof oldestKey !== "string") break;
		permissionAllowAlwaysApprovals.delete(oldestKey);
	}
}
function pruneNativeHookRelayPermissionAllowAlways(now = Date.now()) {
	const validNow = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(now);
	if (validNow === void 0) return;
	for (const [key, entry] of permissionAllowAlwaysApprovals) {
		const expiresAtMs = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(entry.expiresAtMs);
		if (expiresAtMs === void 0 || expiresAtMs <= validNow) permissionAllowAlwaysApprovals.delete(key);
	}
}
function removeNativeHookRelayPermissionState(relayId) {
	permissionApprovalWindows.delete(relayId);
	for (const key of pendingPermissionApprovals.keys()) if (key.startsWith(`${relayId}:`)) pendingPermissionApprovals.delete(key);
}
function snapshotNativeHookRelayPayload(payload) {
	return snapshotJsonValue(payload, { remainingStringLength: MAX_NATIVE_HOOK_RELAY_HISTORY_TOTAL_STRING_LENGTH });
}
function snapshotJsonValue(value, state) {
	if (value === null || typeof value === "number" || typeof value === "boolean") return value;
	if (typeof value === "string") return snapshotString(value, state);
	if (Array.isArray(value)) {
		const items = value.slice(0, MAX_NATIVE_HOOK_RELAY_HISTORY_ARRAY_ITEMS).map((item) => snapshotJsonValue(item, state));
		if (value.length > MAX_NATIVE_HOOK_RELAY_HISTORY_ARRAY_ITEMS) items.push("[truncated]");
		return items;
	}
	const snapshot = {};
	const keys = Object.keys(value);
	for (const key of keys.slice(0, MAX_NATIVE_HOOK_RELAY_HISTORY_OBJECT_KEYS)) {
		const item = value[key];
		if (item !== void 0) snapshot[snapshotString(key, state)] = snapshotJsonValue(item, state);
	}
	if (keys.length > MAX_NATIVE_HOOK_RELAY_HISTORY_OBJECT_KEYS) snapshot["[truncated]"] = keys.length - MAX_NATIVE_HOOK_RELAY_HISTORY_OBJECT_KEYS;
	return snapshot;
}
function snapshotString(value, state) {
	if (state.remainingStringLength <= 0) return "[truncated]";
	const limit = Math.min(value.length, MAX_NATIVE_HOOK_RELAY_HISTORY_STRING_LENGTH, state.remainingStringLength);
	if (limit >= value.length) {
		state.remainingStringLength -= limit;
		return value;
	}
	const prefix = (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, limit);
	state.remainingStringLength -= prefix.length;
	return `${prefix}...[truncated]`;
}
function normalizeNativeHookInvocation(params) {
	const metadata = getNativeHookRelayProviderAdapter(params.registration.provider).normalizeMetadata(params.rawPayload);
	return {
		provider: params.registration.provider,
		relayId: params.registration.relayId,
		event: params.event,
		...metadata,
		...params.registration.agentId ? { agentId: params.registration.agentId } : {},
		sessionId: params.registration.sessionId,
		...params.registration.sessionKey ? { sessionKey: params.registration.sessionKey } : {},
		runId: params.registration.runId,
		rawPayload: params.rawPayload,
		receivedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function getNativeHookRelayProviderAdapter(provider) {
	return nativeHookRelayProviderAdapters[provider];
}
function normalizeCodexHookMetadata(rawPayload) {
	const payload = isJsonObject(rawPayload) ? rawPayload : {};
	const metadata = {};
	const nativeEventName = readOptionalString(payload.hook_event_name);
	if (nativeEventName) metadata.nativeEventName = nativeEventName;
	const cwd = readOptionalString(payload.cwd);
	if (cwd) metadata.cwd = cwd;
	const model = readOptionalString(payload.model);
	if (model) metadata.model = model;
	const turnId = readOptionalString(payload.turn_id);
	if (turnId) metadata.turnId = turnId;
	const transcriptPath = readOptionalString(payload.transcript_path);
	if (transcriptPath) metadata.transcriptPath = transcriptPath;
	const permissionMode = readOptionalString(payload.permission_mode);
	if (permissionMode) metadata.permissionMode = permissionMode;
	const stopHookActive = readOptionalBoolean(payload.stop_hook_active);
	if (stopHookActive !== void 0) metadata.stopHookActive = stopHookActive;
	const lastAssistantMessage = readOptionalString(payload.last_assistant_message);
	if (lastAssistantMessage) metadata.lastAssistantMessage = lastAssistantMessage;
	const toolName = readOptionalString(payload.tool_name);
	if (toolName) metadata.toolName = toolName;
	const toolUseId = readOptionalString(payload.tool_use_id);
	if (toolUseId) metadata.toolUseId = toolUseId;
	return metadata;
}
function readCodexToolInput(rawPayload) {
	const payload = isJsonObject(rawPayload) ? rawPayload : {};
	const toolInput = payload.tool_input;
	if (isJsonObject(toolInput)) return normalizeCodexToolInput(normalizeNativeHookToolName(readOptionalString(payload.tool_name)), toolInput);
	if (toolInput === void 0) return {};
	return { value: toolInput };
}
function normalizeCodexToolInput(toolName, toolInput) {
	const command = normalizeCodexCommand(toolInput.cmd);
	if (toolName !== "exec" || command === void 0) return toolInput;
	return {
		...toolInput,
		command
	};
}
function normalizeCodexCommand(value) {
	if (typeof value === "string") return value;
	if (Array.isArray(value) && value.every((part) => typeof part === "string")) return shellQuoteArgs(value);
}
function nativeHookRelayParamsWereRewritten(originalFingerprint, candidate) {
	if (candidate === void 0) return false;
	return require_stable_stringify.stableStringify(candidate) !== originalFingerprint;
}
function readCodexToolResponse(rawPayload) {
	return (isJsonObject(rawPayload) ? rawPayload : {}).tool_response;
}
function readNativeHookRelayApprovalMode(rawPayload) {
	return (isJsonObject(rawPayload) ? rawPayload : {}).operator_approval_mode === "report" ? "report" : void 0;
}
function normalizeNativeHookToolName(toolName) {
	const normalized = require_tool_policy.normalizeToolName(toolName ?? "tool");
	return NATIVE_HOOK_TOOL_NAME_ALIASES[normalized] ?? normalized;
}
async function requestNativeHookRelayPermissionApproval(request) {
	const timeoutMs = DEFAULT_PERMISSION_TIMEOUT_MS;
	const requestResult = await require_gateway.callGatewayTool("plugin.approval.request", { timeoutMs: 13e4 }, {
		pluginId: `operator-native-hook-relay-${request.provider}`,
		title: truncateText(`${nativeHookRelayProviderDisplayName(request.provider)} permission request`, MAX_APPROVAL_TITLE_LENGTH),
		description: truncateText(formatPermissionApprovalDescription(request), MAX_APPROVAL_DESCRIPTION_LENGTH),
		severity: "warning",
		toolName: request.toolName,
		toolCallId: request.toolCallId,
		allowedDecisions: [
			require_hook_helpers.PluginApprovalResolutions.ALLOW_ONCE,
			require_hook_helpers.PluginApprovalResolutions.ALLOW_ALWAYS,
			require_hook_helpers.PluginApprovalResolutions.DENY
		],
		agentId: request.agentId,
		sessionKey: request.sessionKey,
		timeoutMs,
		twoPhase: true
	}, { expectFinal: false });
	const approvalId = requestResult?.id;
	if (!approvalId) return "defer";
	let decision;
	if (Object.hasOwn(requestResult ?? {}, "decision")) decision = requestResult.decision;
	else {
		const waitResult = await waitForNativeHookRelayApprovalDecision({
			approvalId,
			signal: request.signal,
			timeoutMs
		});
		decision = waitResult?.id === approvalId ? waitResult.decision : void 0;
	}
	if (decision === require_hook_helpers.PluginApprovalResolutions.ALLOW_ONCE) return "allow";
	if (decision === require_hook_helpers.PluginApprovalResolutions.ALLOW_ALWAYS) return "allow-always";
	if (decision === require_hook_helpers.PluginApprovalResolutions.DENY) return "deny";
	return "defer";
}
async function waitForNativeHookRelayApprovalDecision(params) {
	const waitPromise = require_gateway.callGatewayTool("plugin.approval.waitDecision", { timeoutMs: params.timeoutMs + 1e4 }, { id: params.approvalId });
	if (!params.signal) return waitPromise;
	let onAbort;
	const abortPromise = new Promise((_, reject) => {
		if (params.signal.aborted) {
			reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(params.signal.reason, "Non-Error rejection"));
			return;
		}
		onAbort = () => reject((0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(params.signal.reason, "Non-Error rejection"));
		params.signal.addEventListener("abort", onAbort, { once: true });
	});
	try {
		return await Promise.race([waitPromise, abortPromise]);
	} finally {
		if (onAbort) params.signal.removeEventListener("abort", onAbort);
	}
}
function formatPermissionApprovalDescription(request) {
	return [
		`Tool: ${sanitizeApprovalText(request.toolName)}`,
		request.cwd ? `Cwd: ${sanitizeApprovalText(request.cwd)}` : void 0,
		request.model ? `Model: ${sanitizeApprovalText(request.model)}` : void 0,
		formatToolInputPreview(request.toolInput)
	].filter((line) => Boolean(line)).join("\n");
}
function formatToolInputPreview(toolInput) {
	const command = readOptionalString(toolInput.command);
	if (command) return `Command: ${truncateText(sanitizeApprovalText(command), 240)}`;
	const keys = Object.keys(toolInput).map(sanitizeApprovalText).filter(Boolean).toSorted();
	if (!keys.length) return;
	return `Input keys: ${keys.slice(0, 12).join(", ")}${keys.length > 12 ? ` (${keys.length - 12} omitted)` : ""}`;
}
function sanitizeApprovalText(value) {
	let sanitized = "";
	for (const char of require_ansi.stripAnsi(value)) {
		const codePoint = char.codePointAt(0);
		sanitized += codePoint != null && isUnsafeApprovalCodePoint(codePoint) ? " " : char;
	}
	return sanitized.replace(/\s+/g, " ").trim();
}
function isUnsafeApprovalCodePoint(codePoint) {
	return codePoint >= 0 && codePoint <= 8 || codePoint === 11 || codePoint === 12 || codePoint >= 14 && codePoint <= 31 || codePoint >= 127 && codePoint <= 159 || codePoint >= 8234 && codePoint <= 8238 || codePoint >= 8294 && codePoint <= 8297;
}
function nativeHookRelayProviderDisplayName(provider) {
	if (provider === "codex") return "Codex";
	return provider;
}
function truncateText(value, maxLength) {
	if (value.length <= maxLength) return value;
	return `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(value, Math.max(0, maxLength - 3))}...`;
}
function normalizePositiveInteger(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
function shellQuoteArgs(args) {
	return args.map((arg) => shellQuoteArg(arg, process.platform)).join(" ");
}
function shellQuoteArg(value, platform) {
	if (/^[A-Za-z0-9_/:=.,@%+-]+$/.test(value)) return value;
	if (platform === "win32") return `"${value.replaceAll("\"", "\\\"")}"`;
	return `'${value.replaceAll("'", "'\\''")}'`;
}
function readNativeHookRelayProvider(value) {
	if (value === "codex") return value;
	throw new Error("unsupported native hook relay provider");
}
function readNativeHookRelayEvent(value) {
	if (value === "pre_tool_use" || value === "post_tool_use" || value === "permission_request" || value === "before_agent_finalize") return value;
	throw new Error("unsupported native hook relay event");
}
function readNonEmptyString(value, name) {
	if (typeof value === "string" && value.trim()) return value.trim();
	throw new Error(`native hook relay ${name} is required`);
}
function readOptionalString(value) {
	return typeof value === "string" && value.length > 0 ? value : void 0;
}
function readOptionalBoolean(value) {
	return typeof value === "boolean" ? value : void 0;
}
function isJsonValue(value) {
	const stack = [{
		value,
		depth: 0
	}];
	let nodes = 0;
	let totalStringLength = 0;
	while (stack.length) {
		const current = stack.pop();
		nodes += 1;
		if (nodes > MAX_NATIVE_HOOK_RELAY_JSON_NODES) return false;
		if (current.depth > MAX_NATIVE_HOOK_RELAY_JSON_DEPTH) return false;
		if (current.value === null) continue;
		if (typeof current.value === "string") {
			if (current.value.length > MAX_NATIVE_HOOK_RELAY_STRING_LENGTH) return false;
			totalStringLength += current.value.length;
			if (totalStringLength > MAX_NATIVE_HOOK_RELAY_TOTAL_STRING_LENGTH) return false;
			continue;
		}
		if (typeof current.value === "number") {
			if (!Number.isFinite(current.value)) return false;
			continue;
		}
		if (typeof current.value === "boolean") continue;
		if (Array.isArray(current.value)) {
			for (const valueLocal of current.value) {
				if (nodes + stack.length + 1 > MAX_NATIVE_HOOK_RELAY_JSON_NODES) return false;
				stack.push({
					value: valueLocal,
					depth: current.depth + 1
				});
			}
			continue;
		}
		if (!isJsonObject(current.value)) return false;
		try {
			for (const key in current.value) {
				if (!Object.hasOwn(current.value, key)) continue;
				if (key.length > MAX_NATIVE_HOOK_RELAY_STRING_LENGTH) return false;
				totalStringLength += key.length;
				if (totalStringLength > MAX_NATIVE_HOOK_RELAY_TOTAL_STRING_LENGTH) return false;
				if (nodes + stack.length + 1 > MAX_NATIVE_HOOK_RELAY_JSON_NODES) return false;
				stack.push({
					value: current.value[key],
					depth: current.depth + 1
				});
			}
		} catch {
			return false;
		}
	}
	return true;
}
function isJsonObject(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	try {
		const prototype = Object.getPrototypeOf(value);
		return prototype === Object.prototype || prototype === null;
	} catch {
		return false;
	}
}
//#endregion
//#region src/gateway/server-methods/native-hook-relay.ts
/** Gateway request handlers for invoking registered native hook relays. */
const nativeHookRelayHandlers = { "nativeHook.invoke": async ({ params, respond }) => {
	try {
		respond(true, await invokeNativeHookRelay({
			provider: params.provider,
			relayId: params.relayId,
			generation: params.generation,
			event: params.event,
			rawPayload: params.rawPayload,
			requireGeneration: true
		}));
	} catch (error) {
		respond(false, void 0, require_error_codes.errorShape(require_error_codes.ErrorCodes.INVALID_REQUEST, error instanceof Error ? error.message : "native hook relay failed"));
	}
} };
//#endregion
exports.nativeHookRelayHandlers = nativeHookRelayHandlers;
