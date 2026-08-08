const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_web_tools = require("./web-tools-fb2XR9TB.cjs");
const require_internal_runtime_context = require("./internal-runtime-context-C0HOZ5eF.cjs");
const require_gateway_work_admission = require("./gateway-work-admission-BMCDu2MF.cjs");
const require_host_compat = require("./host-compat-Dv3sKwAS.cjs");
const require_logger = require("./logger-B-gij7u9.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_task_completion_contract = require("./task-completion-contract-BuZl36IV.cjs");
const require_task_owner_access = require("./task-owner-access-C26i741X.cjs");
const require_attempt_prompt_helpers = require("./attempt.prompt-helpers-Dk0zUrmw.cjs");
const require_transcript_rewrite = require("./transcript-rewrite-CrjemdE4.cjs");
const require_lifecycle_hook_helpers = require("./lifecycle-hook-helpers-QUNXi5sC.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/agents/tool-mutation-names.ts
const MUTATING_TOOL_NAMES = /* @__PURE__ */ new Set([
	"write",
	"edit",
	"apply_patch",
	"exec",
	"bash",
	"process",
	"message",
	"sessions",
	"sessions_spawn",
	"sessions_send",
	"cron",
	"gateway",
	"canvas",
	"computer",
	"nodes",
	"session_status",
	"create_goal",
	"update_goal"
]);
function isLikelyMutatingToolName(toolName) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	return Boolean(normalized && (MUTATING_TOOL_NAMES.has(normalized) || normalized.endsWith("_actions") || normalized.startsWith("message_") || normalized.includes("send")));
}
//#endregion
//#region src/agents/tool-mutation.ts
/**
* Tool mutation classification and fingerprinting.
*
* Identifies mutating tool calls and file targets so retry/recovery logic can reason about side effects.
*/
const FILE_MUTATING_TOOL_NAMES = /* @__PURE__ */ new Set(["edit", "write"]);
const FILE_TARGET_PATH_ARG_KEYS = [
	"path",
	"file_path",
	"filePath",
	"filepath",
	"file"
];
const FILE_TARGET_OLDPATH_ARG_KEYS = ["oldPath", "old_path"];
const READ_ONLY_ACTIONS = /* @__PURE__ */ new Set([
	"get",
	"list",
	"read",
	"status",
	"show",
	"fetch",
	"search",
	"query",
	"view",
	"poll",
	"log",
	"inspect",
	"check",
	"probe",
	"runs"
]);
const PROCESS_MUTATING_ACTIONS = /* @__PURE__ */ new Set([
	"write",
	"send_keys",
	"submit",
	"paste",
	"kill",
	"clear",
	"remove"
]);
const PROCESS_REPLAY_SAFE_ACTIONS = /* @__PURE__ */ new Set(["list", "log"]);
const MESSAGE_READ_ONLY_ACTIONS = /* @__PURE__ */ new Set([
	"reactions",
	"read",
	"list_pins",
	"permissions",
	"thread_list",
	"search",
	"sticker_search",
	"member_info",
	"role_info",
	"emoji_list",
	"channel_info",
	"channel_list",
	"voice_status",
	"event_list"
]);
const REPLAY_SAFE_TOOL_NAMES = /* @__PURE__ */ new Set([
	"agents_list",
	"find",
	"get_goal",
	"glob",
	"grep",
	"image",
	"ls",
	"memory_get",
	"memory_search",
	"pdf",
	"read",
	"search",
	"sessions_history",
	"sessions_list",
	"sessions_search",
	"tool_describe",
	"tool_search",
	"update_plan",
	"web_fetch",
	"web_search",
	"x_search"
]);
const BROWSER_READ_ONLY_ACTIONS = /* @__PURE__ */ new Set([
	"console",
	"profiles",
	"snapshot",
	"status",
	"tabs"
]);
const COMPUTER_REPLAY_SAFE_ACTIONS = /* @__PURE__ */ new Set(["screenshot", "wait"]);
const GATEWAY_REPLAY_SAFE_ACTIONS = /* @__PURE__ */ new Set(["config.get", "config.schema.lookup"]);
const NODES_REPLAY_SAFE_ACTIONS = /* @__PURE__ */ new Set([
	"status",
	"describe",
	"pending"
]);
const READ_ONLY_SHELL_COMMANDS = /* @__PURE__ */ new Set([
	"cat",
	"grep",
	"head",
	"ls",
	"pwd",
	"rg",
	"stat",
	"tail",
	"wc"
]);
const READ_ONLY_GH_PR_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"checks",
	"diff",
	"list",
	"status",
	"view"
]);
const READ_ONLY_GH_ISSUE_SUBCOMMANDS = /* @__PURE__ */ new Set([
	"list",
	"status",
	"view"
]);
const UNSAFE_RG_FLAGS = /* @__PURE__ */ new Set([
	"--hostname-bin",
	"--pre",
	"--pre-glob",
	"--search-zip",
	"-z"
]);
const UNSAFE_RG_VALUE_FLAGS = [
	"--hostname-bin",
	"--pre",
	"--pre-glob"
];
const SHELL_EXPANSION_CHARS = /* @__PURE__ */ new Set([
	"$",
	"*",
	"?",
	"[",
	"]",
	"{",
	"}",
	"~"
]);
function normalizeActionName(value) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value)?.replace(/[\s-]+/g, "_") || void 0;
}
function readShellCommand(record) {
	const command = record?.command ?? record?.cmd;
	if (typeof command !== "string") return;
	return command.trim() || void 0;
}
function tokenizeSimpleShellCommand(command) {
	if (/[;&|<>\n\r`]/.test(command) || command.includes("\\")) return;
	for (const char of SHELL_EXPANSION_CHARS) if (command.includes(char)) return;
	const tokens = [];
	let current = "";
	let quote;
	for (const char of command) {
		if (quote) {
			if (char === quote) quote = void 0;
			else current += char;
			continue;
		}
		if (char === "'" || char === "\"") {
			quote = char;
			continue;
		}
		if (/\s/.test(char)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
			continue;
		}
		current += char;
	}
	if (quote) return;
	if (current) tokens.push(current);
	return tokens.length > 0 ? tokens : void 0;
}
function isReadOnlySedCommand(tokens) {
	const args = tokens.slice(1);
	if (args.some((token) => token === "--in-place" || token.startsWith("--in-place="))) return false;
	if (args.some((token) => token.startsWith("-") && token !== "-" && token.includes("i"))) return false;
	if (args.some((token) => token === "-e" || token === "--expression")) return false;
	let sawSuppressAutoPrint = false;
	let expression;
	for (const token of args) {
		if (token === "--in-place" || token.startsWith("--in-place=")) return false;
		if (token === "--quiet" || token === "--silent") {
			sawSuppressAutoPrint = true;
			continue;
		}
		if (token.startsWith("-") && token !== "-") {
			if (token.includes("i")) return false;
			if (token.includes("n")) sawSuppressAutoPrint = true;
			continue;
		}
		expression ??= token;
		break;
	}
	return sawSuppressAutoPrint && expression != null && /^(\d+|\$)(,(\d+|\$))?p$/.test(expression);
}
function hasUnsafeRipgrepFlag(tokens) {
	return tokens.some((token) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token);
		return UNSAFE_RG_FLAGS.has(normalized) || UNSAFE_RG_VALUE_FLAGS.some((flag) => normalized.startsWith(`${flag}=`));
	});
}
function isReadOnlyGhCommand(tokens) {
	if (tokens.some((token) => {
		const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(token);
		return normalized === "--web" || normalized.startsWith("--web=") || /^-[a-z]*w[a-z]*(?:=.*)?$/.test(normalized);
	})) return false;
	const area = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(tokens[1]);
	const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(tokens[2]);
	if (area === "search") return action.length > 0;
	if (area === "pr") return READ_ONLY_GH_PR_SUBCOMMANDS.has(action);
	if (area === "issue") return READ_ONLY_GH_ISSUE_SUBCOMMANDS.has(action);
	return false;
}
function isPlainReadOnlyShellCommand(command) {
	if (!command) return false;
	const tokens = tokenizeSimpleShellCommand(command);
	if (!tokens) return false;
	const executable = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(tokens[0]);
	if (executable === "rg" && hasUnsafeRipgrepFlag(tokens)) return false;
	if (READ_ONLY_SHELL_COMMANDS.has(executable)) return true;
	if (executable === "sed") return isReadOnlySedCommand(tokens);
	if (executable === "gh") return isReadOnlyGhCommand(tokens);
	return false;
}
function normalizeFingerprintValue(value) {
	if (typeof value === "string") {
		const normalized = value.trim();
		return normalized ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(normalized) : void 0;
	}
	if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(String(value));
}
function appendFingerprintAlias(parts, record, label, keys) {
	for (const key of keys) {
		const value = normalizeFingerprintValue(record?.[key]);
		if (!value) continue;
		parts.push(`${label}=${value}`);
		return true;
	}
	return false;
}
function isMutatingToolCall(toolName, args) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalObjectRecord)(args);
	const action = normalizeActionName(record?.action);
	switch (normalized) {
		case "write":
		case "edit":
		case "apply_patch":
		case "sessions_spawn":
		case "sessions_send":
		case "create_goal":
		case "update_goal": return true;
		case "exec":
		case "bash": return !isPlainReadOnlyShellCommand(readShellCommand(record));
		case "process": return action != null && PROCESS_MUTATING_ACTIONS.has(action);
		case "message": return action == null || !MESSAGE_READ_ONLY_ACTIONS.has(action);
		case "sessions": return action !== "group_list";
		case "computer": return action == null || !COMPUTER_REPLAY_SAFE_ACTIONS.has(action);
		case "subagents": return action === "cancel" || action === "kill" || action === "steer";
		case "session_status": return typeof record?.model === "string" && record.model.trim().length > 0;
		case "gateway": return action == null || !GATEWAY_REPLAY_SAFE_ACTIONS.has(action);
		case "nodes": return action == null || !NODES_REPLAY_SAFE_ACTIONS.has(action);
		default:
			if (normalized === "cron" || normalized === "canvas") return action == null || !READ_ONLY_ACTIONS.has(action);
			if (normalized.endsWith("_actions")) return action == null || !READ_ONLY_ACTIONS.has(action);
			if (normalized.startsWith("message_") || normalized.includes("send")) return true;
			return false;
	}
}
/** Return true only for tool calls whose structured contract proves replay safety. */
function isReplaySafeToolCall(toolName, args) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	const action = normalizeActionName((0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalObjectRecord)(args)?.action);
	if (REPLAY_SAFE_TOOL_NAMES.has(normalized)) return true;
	switch (normalized) {
		case "exec":
		case "bash": return false;
		case "process": return action != null && PROCESS_REPLAY_SAFE_ACTIONS.has(action);
		case "message": return action != null && MESSAGE_READ_ONLY_ACTIONS.has(action);
		case "subagents": return action == null || action === "list";
		case "sessions": return action === "group_list";
		case "session_status": return !isMutatingToolCall(normalized, args);
		case "browser": return action != null && BROWSER_READ_ONLY_ACTIONS.has(action);
		case "computer": return action != null && COMPUTER_REPLAY_SAFE_ACTIONS.has(action);
		case "skill_workshop": return action === "list" || action === "inspect";
		case "transcripts": return action === "status";
		case "gateway": return action != null && GATEWAY_REPLAY_SAFE_ACTIONS.has(action);
		case "nodes": return action != null && NODES_REPLAY_SAFE_ACTIONS.has(action);
		default:
			if (normalized === "cron" || normalized === "canvas") return action != null && READ_ONLY_ACTIONS.has(action);
			return false;
	}
}
function buildToolActionFingerprint(toolName, args, meta) {
	if (!isMutatingToolCall(toolName, args)) return;
	const normalizedTool = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(toolName);
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalObjectRecord)(args);
	const action = normalizeActionName(record?.action);
	const parts = [`tool=${normalizedTool}`];
	if (action) parts.push(`action=${action}`);
	let hasStableTarget = false;
	hasStableTarget = appendFingerprintAlias(parts, record, "path", [
		"path",
		"file_path",
		"filePath",
		"filepath",
		"file"
	]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "oldpath", ["oldPath", "old_path"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "newpath", ["newPath", "new_path"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "to", ["to", "target"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "messageid", ["messageId", "message_id"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "sessionkey", ["sessionKey", "session_key"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "jobid", ["jobId", "job_id"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "id", ["id"]) || hasStableTarget;
	hasStableTarget = appendFingerprintAlias(parts, record, "model", ["model"]) || hasStableTarget;
	const normalizedMeta = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(meta?.trim().replace(/\s+/g, " "));
	if (normalizedMeta && !hasStableTarget) parts.push(`meta=${normalizedMeta}`);
	return parts.join("|");
}
function isFileMutatingToolName(rawName) {
	return FILE_MUTATING_TOOL_NAMES.has((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rawName));
}
function readArgFingerprintValue(record, keys) {
	if (!record) return;
	for (const key of keys) {
		const normalized = normalizeFingerprintValue(record[key]);
		if (normalized) return normalized;
	}
}
function extractFileTarget(toolName, args) {
	if (!isFileMutatingToolName(toolName)) return;
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asOptionalObjectRecord)(args);
	const path = readArgFingerprintValue(record, FILE_TARGET_PATH_ARG_KEYS);
	const oldpath = readArgFingerprintValue(record, FILE_TARGET_OLDPATH_ARG_KEYS);
	if (!path && !oldpath) return;
	return {
		...path !== void 0 ? { path } : {},
		...oldpath !== void 0 ? { oldpath } : {}
	};
}
function fileTargetsEqual(a, b) {
	return (a.path ?? "") === (b.path ?? "") && (a.oldpath ?? "") === (b.oldpath ?? "");
}
function buildToolMutationState(toolName, args, meta) {
	const actionFingerprint = buildToolActionFingerprint(toolName, args, meta);
	const fileTarget = extractFileTarget(toolName, args);
	return {
		mutatingAction: actionFingerprint != null,
		replaySafe: isReplaySafeToolCall(toolName, args),
		actionFingerprint,
		...fileTarget !== void 0 ? { fileTarget } : {}
	};
}
function isSameToolMutationAction(existing, next) {
	if (existing.actionFingerprint != null || next.actionFingerprint != null) {
		if (existing.actionFingerprint == null || next.actionFingerprint == null) return false;
		if (existing.actionFingerprint === next.actionFingerprint) return true;
		if (isFileMutatingToolName(existing.toolName) && isFileMutatingToolName(next.toolName) && existing.fileTarget !== void 0 && next.fileTarget !== void 0 && fileTargetsEqual(existing.fileTarget, next.fileTarget)) return true;
		return false;
	}
	return existing.toolName === next.toolName && (existing.meta ?? "") === (next.meta ?? "");
}
//#endregion
//#region src/context-engine/runtime-settings.ts
const RUNTIME_REASON_CODES = /* @__PURE__ */ new Set([
	"provider_timeout",
	"provider_unavailable",
	"rate_limited",
	"context_overflow",
	"runtime_unavailable",
	"unknown"
]);
function normalizeNullableString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}
function normalizeNullableNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function normalizeReasonCode(value) {
	const normalized = normalizeNullableString(value);
	if (!normalized) return null;
	if (RUNTIME_REASON_CODES.has(normalized)) return normalized;
	const lower = normalized.toLowerCase();
	if (lower.includes("timeout")) return "provider_timeout";
	if (lower.includes("rate") || lower.includes("limit") || lower.includes("429")) return "rate_limited";
	if (lower.includes("overflow") || lower.includes("context") || lower.includes("pressure")) return "context_overflow";
	if (lower.includes("runtime")) return "runtime_unavailable";
	if (lower.includes("provider") || lower.includes("primary") || lower.includes("unavailable")) return "provider_unavailable";
	return "unknown";
}
function buildContextEngineRuntimeSettings(params) {
	const hostId = normalizeNullableString(params.contextEngineHost.id);
	const selectedId = normalizeNullableString(params.selectedContextEngineId);
	const selectionSource = params.contextEngineSelectionSource ?? (selectedId ? "configured" : "unknown");
	const requestedModel = normalizeNullableString(params.requestedModel);
	const resolvedModel = normalizeNullableString(params.resolvedModel);
	const fallbackReason = normalizeReasonCode(params.fallbackReason);
	const degradedReason = normalizeReasonCode(params.degradedReason);
	const resolvedViaFallback = requestedModel !== null && resolvedModel !== null && requestedModel !== resolvedModel;
	return {
		schemaVersion: 1,
		runtime: {
			host: "@gabrielvfonseca/operator",
			mode: params.mode ?? (degradedReason ? "degraded" : fallbackReason || resolvedViaFallback ? "fallback" : "normal"),
			harnessId: normalizeNullableString(params.harnessId),
			runtimeId: normalizeNullableString(params.runtimeId)
		},
		model: {
			requested: requestedModel,
			resolved: resolvedModel,
			provider: normalizeNullableString(params.provider),
			family: normalizeNullableString(params.modelFamily)
		},
		contextEngineSelection: {
			selectedId,
			source: selectionSource
		},
		executionHost: {
			id: hostId,
			label: normalizeNullableString(params.contextEngineHost.label)
		},
		limits: {
			promptTokenBudget: normalizeNullableNumber(params.promptTokenBudget),
			maxOutputTokens: normalizeNullableNumber(params.maxOutputTokens)
		},
		diagnostics: {
			fallbackReason,
			degradedReason
		}
	};
}
//#endregion
//#region src/agents/embedded-agent-runner/context-engine-maintenance.ts
/**
* Schedules and runs deferred context-engine turn maintenance.
*/
const TURN_MAINTENANCE_TASK_KIND = "context_engine_turn_maintenance";
const TURN_MAINTENANCE_TASK_LABEL = "Context engine turn maintenance";
const TURN_MAINTENANCE_TASK_TASK = "Deferred context-engine maintenance after turn.";
const TURN_MAINTENANCE_LANE_PREFIX = "context-engine-turn-maintenance:";
const TURN_MAINTENANCE_LONG_WAIT_MS = 1e4;
const DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY = Symbol.for("operator.contextEngineTurnMaintenanceAbortState");
const activeDeferredTurnMaintenanceRuns = /* @__PURE__ */ new Map();
function resolveDeferredTurnMaintenanceAbortState(processLike) {
	const existing = processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY];
	if (existing) return existing;
	const created = {
		registered: false,
		controllers: /* @__PURE__ */ new Set(),
		cleanupHandlers: /* @__PURE__ */ new Map()
	};
	processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY] = created;
	return created;
}
function unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state) {
	if (!state.registered) return;
	for (const [signal, handler] of state.cleanupHandlers) processLike.off(signal, handler);
	state.cleanupHandlers.clear();
	state.registered = false;
}
function normalizeSessionKey(sessionKey) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionKey) || void 0;
}
function resolveDeferredTurnMaintenanceLane(sessionKey) {
	return `${TURN_MAINTENANCE_LANE_PREFIX}${sessionKey}`;
}
async function disposeDeferredMaintenanceContextEngine(contextEngine) {
	try {
		await contextEngine.dispose?.();
	} catch (err) {
		require_logger.log.warn("context engine dispose failed after deferred maintenance", { errorMessage: require_errors.formatErrorMessage(err) });
	}
}
function createDeferredTurnMaintenanceAbortSignal(params) {
	if (typeof AbortController === "undefined") return {
		abortSignal: void 0,
		dispose: () => {}
	};
	const processLike = params?.processLike ?? process;
	const state = resolveDeferredTurnMaintenanceAbortState(processLike);
	const handleTerminationSignal = (signalName) => {
		const shouldReraise = typeof processLike.listenerCount === "function" ? processLike.listenerCount(signalName) === 1 : false;
		for (const activeController of state.controllers) if (!activeController.signal.aborted) activeController.abort(/* @__PURE__ */ new Error(`received ${signalName} while waiting for deferred maintenance`));
		state.controllers.clear();
		unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state);
		if (shouldReraise && typeof processLike.kill === "function") try {
			processLike.kill(processLike.pid ?? process.pid, signalName);
		} catch {}
	};
	if (!state.registered) {
		state.registered = true;
		const onSigint = () => handleTerminationSignal("SIGINT");
		const onSigterm = () => handleTerminationSignal("SIGTERM");
		state.cleanupHandlers.set("SIGINT", onSigint);
		state.cleanupHandlers.set("SIGTERM", onSigterm);
		processLike.on("SIGINT", onSigint);
		processLike.on("SIGTERM", onSigterm);
	}
	const controller = new AbortController();
	state.controllers.add(controller);
	let disposed = false;
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		state.controllers.delete(controller);
		if (state.controllers.size === 0) unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state);
	};
	return {
		abortSignal: controller.signal,
		dispose: cleanup
	};
}
function resetDeferredTurnMaintenanceStateForTest() {
	activeDeferredTurnMaintenanceRuns.clear();
	const processLike = process;
	const state = processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY];
	if (!state) return;
	state.controllers.clear();
	unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state);
	delete processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY];
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.contextEngineMaintenanceTestApi")] = {
	createDeferredTurnMaintenanceAbortSignal,
	resetDeferredTurnMaintenanceStateForTest
};
async function waitForDeferredTurnMaintenanceForSession(sessionKey) {
	const normalizedSessionKey = normalizeSessionKey(sessionKey);
	if (!normalizedSessionKey) return;
	await activeDeferredTurnMaintenanceRuns.get(normalizedSessionKey)?.promise;
}
function markDeferredTurnMaintenanceTaskScheduleFailure(params) {
	const errorMessage = require_errors.formatErrorMessage(params.error);
	require_logger.log.warn(`failed to schedule deferred context engine maintenance: ${errorMessage}`);
	require_task_owner_access.cancelTaskByIdForOwner({
		taskId: params.taskId,
		callerOwnerKey: params.sessionKey,
		endedAt: Date.now(),
		terminalSummary: `Deferred maintenance could not be scheduled: ${errorMessage}`
	});
}
function buildTurnMaintenanceTaskDescriptor(params) {
	const runId = params.runId ?? `turn-maint:${params.sessionKey}:${Date.now().toString(36)}:${(0, node_crypto.randomUUID)().slice(0, 8)}`;
	return require_task_completion_contract.createQueuedTaskRun({
		runtime: "acp",
		taskKind: TURN_MAINTENANCE_TASK_KIND,
		sourceId: TURN_MAINTENANCE_TASK_KIND,
		requesterSessionKey: params.sessionKey,
		ownerKey: params.sessionKey,
		scopeKind: "session",
		runId,
		label: TURN_MAINTENANCE_TASK_LABEL,
		task: TURN_MAINTENANCE_TASK_TASK,
		notifyPolicy: params.notifyPolicy ?? "silent",
		deliveryStatus: params.deliveryStatus ?? "not_applicable",
		preferMetadata: true
	});
}
function promoteTurnMaintenanceTaskVisibility(params) {
	return buildTurnMaintenanceTaskDescriptor({
		sessionKey: params.sessionKey,
		runId: params.runId,
		notifyPolicy: params.notifyPolicy,
		deliveryStatus: "pending"
	});
}
/**
* Attach runtime-owned transcript rewrite helpers to an existing
* context-engine runtime context payload.
*/
function buildContextEngineMaintenanceRuntimeContext(params) {
	return {
		...params.runtimeContext,
		...require_attempt_prompt_helpers.resolveContextEngineCapabilities({
			config: params.config,
			sessionKey: params.sessionKey,
			agentId: params.agentId,
			authProfileId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.runtimeContext?.authProfileId),
			contextEnginePluginId: params.contextEnginePluginId,
			purpose: params.purpose ?? "context-engine.maintenance"
		}),
		...params.sessionTarget ? { sessionTarget: params.sessionTarget } : {},
		...params.allowDeferredCompactionExecution ? { allowDeferredCompactionExecution: true } : {},
		rewriteTranscriptEntries: async (request) => {
			if (params.sessionManager) {
				const sessionManager = params.sessionManager;
				const rewriteSessionManagerEntries = () => require_transcript_rewrite.rewriteTranscriptEntriesInSessionManager({
					sessionManager,
					replacements: request.replacements
				});
				return params.withSessionManagerRewriteLock ? await params.withSessionManagerRewriteLock(rewriteSessionManagerEntries) : rewriteSessionManagerEntries();
			}
			const rewriteRuntimeTranscriptEntries = async () => await require_transcript_rewrite.rewriteTranscriptEntriesInRuntimeTranscript({
				scope: {
					sessionId: params.sessionId,
					sessionKey: params.sessionKey ?? params.sessionId,
					sessionFile: params.sessionFile,
					...params.agentId ? { agentId: params.agentId } : {}
				},
				request,
				config: params.config
			});
			return await rewriteRuntimeTranscriptEntries();
		}
	};
}
async function executeContextEngineMaintenance(params) {
	if (typeof params.contextEngine.maintain !== "function") return;
	const result = await params.contextEngine.maintain({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionTarget: params.sessionTarget,
		sessionFile: params.sessionFile,
		runtimeSettings: params.runtimeSettings,
		runtimeContext: buildContextEngineMaintenanceRuntimeContext({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			sessionManager: params.executionMode === "background" ? void 0 : params.sessionManager,
			withSessionManagerRewriteLock: params.executionMode === "background" ? void 0 : params.withSessionManagerRewriteLock,
			runtimeContext: params.runtimeContext,
			agentId: params.agentId,
			allowDeferredCompactionExecution: params.executionMode === "background",
			config: params.config,
			purpose: `context-engine.${params.reason}.maintenance`,
			contextEnginePluginId: require_registry.resolveContextEngineOwnerPluginId(params.contextEngine)
		})
	});
	if (result.changed) require_logger.log.info(`[context-engine] maintenance(${params.reason}) changed transcript rewrittenEntries=${result.rewrittenEntries} bytesFreed=${result.bytesFreed} sessionKey=${params.sessionKey ?? params.sessionId ?? "unknown"}`);
	return result;
}
async function runDeferredTurnMaintenanceWorker(params) {
	let surfacedUserNotice = false;
	let longRunningTimer = null;
	const shutdownAbort = createDeferredTurnMaintenanceAbortSignal();
	const surfaceMaintenanceUpdate = (summary, eventSummary) => {
		promoteTurnMaintenanceTaskVisibility({
			sessionKey: params.sessionKey,
			runId: params.runId,
			notifyPolicy: "state_changes"
		});
		surfacedUserNotice = true;
		require_task_completion_contract.recordTaskRunProgressByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			lastEventAt: Date.now(),
			progressSummary: summary,
			eventSummary
		});
	};
	try {
		const runningAt = Date.now();
		require_task_completion_contract.startTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			startedAt: runningAt,
			lastEventAt: runningAt,
			progressSummary: "Running deferred maintenance.",
			eventSummary: "Starting deferred maintenance."
		});
		longRunningTimer = setTimeout(() => {
			try {
				surfaceMaintenanceUpdate("Deferred maintenance is still running.", "Deferred maintenance is still running.");
			} catch (error) {
				require_logger.log.warn(`failed to surface deferred maintenance progress: ${String(error)}`);
			}
		}, TURN_MAINTENANCE_LONG_WAIT_MS);
		const result = await executeContextEngineMaintenance({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			reason: "turn",
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			runtimeSettings: params.runtimeSettings,
			agentId: params.agentId,
			config: params.config,
			executionMode: "background"
		});
		if (longRunningTimer) {
			clearTimeout(longRunningTimer);
			longRunningTimer = null;
		}
		const endedAt = Date.now();
		require_task_completion_contract.completeTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			endedAt,
			lastEventAt: endedAt,
			progressSummary: result?.changed ? "Deferred maintenance completed with transcript changes." : "Deferred maintenance completed.",
			terminalSummary: result?.changed ? `Rewrote ${result.rewrittenEntries} transcript entr${result.rewrittenEntries === 1 ? "y" : "ies"} and freed ${result.bytesFreed} bytes.` : "No transcript changes were needed."
		});
	} catch (err) {
		if (shutdownAbort.abortSignal?.aborted) {
			if (longRunningTimer) {
				clearTimeout(longRunningTimer);
				longRunningTimer = null;
			}
			const task = require_task_owner_access.findTaskByRunIdForOwner({
				runId: params.runId,
				callerOwnerKey: params.sessionKey
			});
			if (task) require_task_owner_access.cancelTaskByIdForOwner({
				taskId: task.taskId,
				callerOwnerKey: params.sessionKey,
				endedAt: Date.now(),
				terminalSummary: "Deferred maintenance cancelled during shutdown."
			});
			return;
		}
		if (longRunningTimer) {
			clearTimeout(longRunningTimer);
			longRunningTimer = null;
		}
		const endedAt = Date.now();
		const reason = require_errors.formatErrorMessage(err);
		if (!surfacedUserNotice) promoteTurnMaintenanceTaskVisibility({
			sessionKey: params.sessionKey,
			runId: params.runId,
			notifyPolicy: "done_only"
		});
		require_task_completion_contract.failTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			endedAt,
			lastEventAt: endedAt,
			error: reason,
			progressSummary: "Deferred maintenance failed.",
			terminalSummary: reason
		});
		require_logger.log.warn(`deferred context engine maintenance failed: ${reason}`);
	} finally {
		shutdownAbort.dispose();
		if (params.disposeContextEngineAfterMaintenance) await disposeDeferredMaintenanceContextEngine(params.contextEngine);
	}
}
function scheduleDeferredTurnMaintenance(params) {
	const sessionKey = normalizeSessionKey(params.sessionKey);
	if (!sessionKey) return;
	if (require_command_queue.isGatewayDraining()) {
		params.onScheduleFailure?.(new require_gateway_work_admission.GatewayDrainingError());
		return;
	}
	const activeRun = activeDeferredTurnMaintenanceRuns.get(sessionKey);
	if (activeRun) {
		const supersededParams = activeRun.rerunRequested ? activeRun.latestParams : void 0;
		activeRun.rerunRequested = true;
		activeRun.latestParams = {
			...params,
			sessionKey
		};
		if (supersededParams?.disposeContextEngineAfterMaintenance && supersededParams.contextEngine !== params.contextEngine) disposeDeferredMaintenanceContextEngine(supersededParams.contextEngine);
		return activeRun.promise;
	}
	const existingTask = require_web_tools.findActiveSessionTask({
		sessionKey,
		runtime: "acp",
		taskKind: TURN_MAINTENANCE_TASK_KIND
	});
	const reusableTask = existingTask?.runId?.trim() ? existingTask : void 0;
	if (existingTask && !reusableTask) {
		require_task_owner_access.updateTaskNotifyPolicyForOwner({
			taskId: existingTask.taskId,
			callerOwnerKey: sessionKey,
			notifyPolicy: "silent"
		});
		require_task_owner_access.cancelTaskByIdForOwner({
			taskId: existingTask.taskId,
			callerOwnerKey: sessionKey,
			endedAt: Date.now(),
			terminalSummary: "Superseded by refreshed deferred maintenance task."
		});
	}
	const task = reusableTask ?? buildTurnMaintenanceTaskDescriptor({ sessionKey });
	if (!task) {
		require_logger.log.warn("[context-engine] failed to create deferred turn maintenance task", { sessionKey });
		return;
	}
	require_logger.log.info(`[context-engine] deferred turn maintenance ${reusableTask ? "resuming" : "queued"} taskId=${task.taskId} sessionKey=${sessionKey} lane=${resolveDeferredTurnMaintenanceLane(sessionKey)}`);
	const schedulerAbort = createDeferredTurnMaintenanceAbortSignal();
	let runPromise;
	try {
		runPromise = require_command_queue.enqueueCommandInLane(resolveDeferredTurnMaintenanceLane(sessionKey), async () => runDeferredTurnMaintenanceWorker({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			runtimeSettings: params.runtimeSettings,
			agentId: params.agentId,
			config: params.config,
			runId: task.runId,
			disposeContextEngineAfterMaintenance: params.disposeContextEngineAfterMaintenance
		}));
	} catch (err) {
		schedulerAbort.dispose();
		markDeferredTurnMaintenanceTaskScheduleFailure({
			sessionKey,
			taskId: task.taskId,
			error: err
		});
		return;
	}
	const cleanupDeferredTurnMaintenance = async () => {
		schedulerAbort.dispose();
		const current = activeDeferredTurnMaintenanceRuns.get(sessionKey);
		if (current !== state) return;
		const shutdownTriggered = schedulerAbort.abortSignal?.aborted === true;
		const rerunParams = current.rerunRequested && !shutdownTriggered ? current.latestParams : void 0;
		const discardedRerunParams = current.rerunRequested && shutdownTriggered ? current.latestParams : void 0;
		activeDeferredTurnMaintenanceRuns.delete(sessionKey);
		if (rerunParams) await scheduleDeferredTurnMaintenance(rerunParams);
		else if (discardedRerunParams?.disposeContextEngineAfterMaintenance) await disposeDeferredMaintenanceContextEngine(discardedRerunParams.contextEngine);
	};
	const trackedPromise = runPromise.catch((err) => {
		params.onScheduleFailure?.(err);
		markDeferredTurnMaintenanceTaskScheduleFailure({
			sessionKey,
			taskId: task.taskId,
			error: err
		});
	}).then(cleanupDeferredTurnMaintenance, async (err) => {
		await cleanupDeferredTurnMaintenance();
		throw err;
	});
	const state = {
		promise: trackedPromise,
		rerunRequested: false,
		latestParams: {
			...params,
			sessionKey
		}
	};
	activeDeferredTurnMaintenanceRuns.set(sessionKey, state);
	return trackedPromise;
}
/**
* Run optional context-engine transcript maintenance and normalize the result.
*/
async function runContextEngineMaintenance(params) {
	if (typeof params.contextEngine?.maintain !== "function") return;
	const executionMode = params.executionMode ?? "foreground";
	if (params.reason === "turn" && executionMode !== "background" && params.contextEngine.info.turnMaintenanceMode === "background") {
		try {
			const deferred = scheduleDeferredTurnMaintenance({
				contextEngine: params.contextEngine,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey ?? params.sessionId,
				sessionTarget: params.sessionTarget,
				sessionFile: params.sessionFile,
				sessionManager: params.sessionManager,
				runtimeContext: params.runtimeContext,
				runtimeSettings: params.runtimeSettings,
				agentId: params.agentId,
				config: params.config,
				disposeContextEngineAfterMaintenance: params.disposeDeferredContextEngineAfterMaintenance,
				onScheduleFailure: params.onDeferredMaintenanceFailure
			});
			if (deferred) params.onDeferredMaintenance?.(deferred);
		} catch (err) {
			require_logger.log.warn(`failed to schedule deferred context engine maintenance: ${String(err)}`);
		}
		return;
	}
	try {
		return await executeContextEngineMaintenance({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			reason: params.reason,
			sessionManager: params.sessionManager,
			withSessionManagerRewriteLock: params.withSessionManagerRewriteLock,
			runtimeContext: params.runtimeContext,
			runtimeSettings: params.runtimeSettings,
			agentId: params.agentId,
			executionMode,
			config: params.config
		});
	} catch (err) {
		require_logger.log.warn(`context engine maintain failed (${params.reason}): ${String(err)}`);
		return;
	}
}
//#endregion
//#region src/agents/harness/context-engine-lifecycle.ts
function buildHarnessContextEngineRuntimeSettings(params) {
	return params.runtimeSettings ?? (() => {
		const selectedId = params.contextEngine?.info.id;
		return buildContextEngineRuntimeSettings({
			contextEngineHost: params.contextEngineHostSupport ?? require_host_compat.OPERATOR_EMBEDDED_CONTEXT_ENGINE_HOST,
			harnessId: params.harnessId,
			runtimeId: params.runtimeId,
			provider: params.providerId,
			requestedModel: params.requestedModelId,
			resolvedModel: params.modelId ?? params.requestedModelId,
			modelFamily: params.modelFamily ?? null,
			selectedContextEngineId: selectedId,
			contextEngineSelectionSource: selectedId === "legacy" ? "default" : selectedId ? "configured" : "unknown",
			promptTokenBudget: params.tokenBudget,
			maxOutputTokens: params.maxOutputTokens,
			fallbackReason: params.fallbackReason,
			degradedReason: params.degradedReason
		});
	})();
}
/**
* Run optional bootstrap + bootstrap maintenance for a harness-owned context engine.
*/
async function bootstrapHarnessContextEngine(params) {
	if (!params.hadSessionFile || !(params.contextEngine?.bootstrap || params.contextEngine?.maintain)) return;
	try {
		const runtimeSettings = buildHarnessContextEngineRuntimeSettings(params);
		if (typeof params.contextEngine?.bootstrap === "function") await params.contextEngine.bootstrap({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			runtimeSettings,
			runtimeContext: params.runtimeContext
		});
		await (params.runMaintenance ?? runHarnessContextEngineMaintenance)({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			reason: "bootstrap",
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			runtimeSettings,
			config: params.config
		});
	} catch (bootstrapErr) {
		params.warn(`context engine bootstrap failed: ${String(bootstrapErr)}`);
	}
}
/**
* Assemble model context through the active harness-owned context engine.
*/
async function assembleHarnessContextEngine(params) {
	if (!params.contextEngine) return;
	const messages = require_internal_runtime_context.stripRuntimeContextCustomMessages(params.messages);
	const runtimeSettings = buildHarnessContextEngineRuntimeSettings(params);
	return ensureAssembleResultShape(await params.contextEngine.assemble({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		messages,
		tokenBudget: params.tokenBudget,
		...params.availableTools ? { availableTools: params.availableTools } : {},
		...params.citationsMode ? { citationsMode: params.citationsMode } : {},
		model: params.modelId,
		runtimeSettings,
		...params.prompt !== void 0 ? { prompt: params.prompt } : {}
	}), params.contextEngine.info.id);
}
/**
* Validate that a context engine's assemble() return value matches the
* AssembleResult contract before the runner consumes it. Engines that omit
* `messages` or return a non-array previously crashed the runner downstream
* when prompt assembly tried to read `activeSession.messages.length` (#75541).
*
* Throws a descriptive error so the runner's existing assemble try/catch can
* log the offending engine id and fall back to the unmodified pipeline
* messages instead of poisoning session state.
*/
function ensureAssembleResultShape(result, engineId) {
	if (!result || typeof result !== "object") throw new Error(`context engine "${engineId}" assemble() returned an invalid result: expected an object with a "messages" array (got ${describeAssembleResultType(result)})`);
	const candidate = result;
	if (!Array.isArray(candidate.messages)) throw new Error(`context engine "${engineId}" assemble() returned an invalid result: expected an object with a "messages" array (got messages of type ${describeAssembleResultType(candidate.messages)})`);
	return result;
}
function describeAssembleResultType(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value;
}
/**
* Finalize a completed harness turn via afterTurn or ingest fallbacks.
*/
async function finalizeHarnessContextEngineTurn(params) {
	if (!params.contextEngine) return { postTurnFinalizationSucceeded: true };
	const conversationSnapshot = buildContextEngineConversationSnapshot({
		messagesSnapshot: params.messagesSnapshot,
		prePromptMessageCount: params.prePromptMessageCount
	});
	const runtimeSettings = buildHarnessContextEngineRuntimeSettings(params);
	let postTurnFinalizationSucceeded = true;
	if (typeof params.contextEngine.afterTurn === "function") try {
		await params.contextEngine.afterTurn({
			sessionId: params.sessionIdUsed,
			sessionKey: params.sessionKey,
			sessionTarget: params.sessionTarget,
			sessionFile: params.sessionFile,
			messages: conversationSnapshot.messages,
			prePromptMessageCount: conversationSnapshot.prePromptMessageCount,
			tokenBudget: params.tokenBudget,
			runtimeSettings,
			runtimeContext: params.runtimeContext,
			isHeartbeat: params.isHeartbeat
		});
	} catch (afterTurnErr) {
		postTurnFinalizationSucceeded = false;
		params.warn(`context engine afterTurn failed: ${String(afterTurnErr)}`);
	}
	else {
		const newMessages = conversationSnapshot.messages.slice(conversationSnapshot.prePromptMessageCount);
		if (newMessages.length > 0) if (typeof params.contextEngine.ingestBatch === "function") try {
			await params.contextEngine.ingestBatch({
				sessionId: params.sessionIdUsed,
				sessionKey: params.sessionKey,
				messages: newMessages,
				isHeartbeat: params.isHeartbeat
			});
		} catch (ingestErr) {
			postTurnFinalizationSucceeded = false;
			params.warn(`context engine ingest failed: ${String(ingestErr)}`);
		}
		else for (const msg of newMessages) try {
			await params.contextEngine.ingest?.({
				sessionId: params.sessionIdUsed,
				sessionKey: params.sessionKey,
				message: msg,
				isHeartbeat: params.isHeartbeat
			});
		} catch (ingestErr) {
			postTurnFinalizationSucceeded = false;
			params.warn(`context engine ingest failed: ${String(ingestErr)}`);
		}
	}
	if (!params.promptError && !params.aborted && !params.yieldAborted && postTurnFinalizationSucceeded) await (params.runMaintenance ?? runHarnessContextEngineMaintenance)({
		contextEngine: params.contextEngine,
		sessionId: params.sessionIdUsed,
		sessionKey: params.sessionKey,
		sessionTarget: params.sessionTarget,
		sessionFile: params.sessionFile,
		reason: "turn",
		sessionManager: params.sessionManager,
		runtimeContext: params.runtimeContext,
		runtimeSettings,
		config: params.config
	});
	return { postTurnFinalizationSucceeded };
}
function buildContextEngineConversationSnapshot(params) {
	const prePromptMessages = require_internal_runtime_context.stripRuntimeContextCustomMessages(params.messagesSnapshot.slice(0, params.prePromptMessageCount));
	const turnMessages = require_internal_runtime_context.stripRuntimeContextCustomMessages(params.messagesSnapshot.slice(params.prePromptMessageCount));
	return {
		messages: [...prePromptMessages, ...turnMessages],
		prePromptMessageCount: prePromptMessages.length
	};
}
/**
* Run optional transcript maintenance for a harness-owned context engine.
*/
async function runHarnessContextEngineMaintenance(params) {
	const runtimeSettings = buildHarnessContextEngineRuntimeSettings(params);
	return await runContextEngineMaintenance({
		contextEngine: params.contextEngine,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionTarget: params.sessionTarget,
		sessionFile: params.sessionFile,
		reason: params.reason,
		sessionManager: params.sessionManager,
		runtimeContext: params.runtimeContext,
		runtimeSettings,
		executionMode: params.executionMode,
		onDeferredMaintenance: params.onDeferredMaintenance,
		config: params.config
	});
}
//#endregion
//#region src/agents/harness/agent-end-side-effects.ts
/**
* Agent-end side effect runner.
*
* Harnesses use this to trigger core research capture and plugin agent_end hooks
* either fire-and-forget or awaited during tests/shutdown.
*/
const log = require_subsystem.createSubsystemLogger("agents/harness");
async function runCoreAgentEndSideEffects(params) {
	try {
		const { scheduleSkillExperienceReview } = await Promise.resolve().then(() => require("./experience-review-default-Cyit4DVV.cjs"));
		scheduleSkillExperienceReview({
			event: params.event,
			ctx: params.ctx,
			...params.ctx.config ? { config: params.ctx.config } : {}
		});
	} catch (error) {
		log.warn(`skill experience review scheduling failed: ${String(error)}`);
	}
	try {
		const { runSkillResearchAutoCapture } = await Promise.resolve().then(() => require("./autocapture-lwr--Nkk.cjs"));
		await runSkillResearchAutoCapture({
			event: params.event,
			ctx: params.ctx,
			...params.ctx.config ? { config: params.ctx.config } : {}
		});
	} catch (error) {
		log.warn(`skill research auto-capture failed: ${String(error)}`);
	}
}
/** Starts agent-end side effects without waiting for completion. */
function runAgentEndSideEffects(params) {
	runCoreAgentEndSideEffects(params);
	require_lifecycle_hook_helpers.runAgentHarnessAgentEndHook(params);
}
/** Runs agent-end side effects and waits for plugin/core completion. */
async function awaitAgentEndSideEffects(params) {
	await runCoreAgentEndSideEffects(params);
	await require_lifecycle_hook_helpers.awaitAgentHarnessAgentEndHook(params);
}
//#endregion
Object.defineProperty(exports, "assembleHarnessContextEngine", {
	enumerable: true,
	get: function() {
		return assembleHarnessContextEngine;
	}
});
Object.defineProperty(exports, "awaitAgentEndSideEffects", {
	enumerable: true,
	get: function() {
		return awaitAgentEndSideEffects;
	}
});
Object.defineProperty(exports, "bootstrapHarnessContextEngine", {
	enumerable: true,
	get: function() {
		return bootstrapHarnessContextEngine;
	}
});
Object.defineProperty(exports, "buildContextEngineRuntimeSettings", {
	enumerable: true,
	get: function() {
		return buildContextEngineRuntimeSettings;
	}
});
Object.defineProperty(exports, "buildToolMutationState", {
	enumerable: true,
	get: function() {
		return buildToolMutationState;
	}
});
Object.defineProperty(exports, "finalizeHarnessContextEngineTurn", {
	enumerable: true,
	get: function() {
		return finalizeHarnessContextEngineTurn;
	}
});
Object.defineProperty(exports, "isLikelyMutatingToolName", {
	enumerable: true,
	get: function() {
		return isLikelyMutatingToolName;
	}
});
Object.defineProperty(exports, "isSameToolMutationAction", {
	enumerable: true,
	get: function() {
		return isSameToolMutationAction;
	}
});
Object.defineProperty(exports, "runAgentEndSideEffects", {
	enumerable: true,
	get: function() {
		return runAgentEndSideEffects;
	}
});
Object.defineProperty(exports, "runContextEngineMaintenance", {
	enumerable: true,
	get: function() {
		return runContextEngineMaintenance;
	}
});
Object.defineProperty(exports, "runHarnessContextEngineMaintenance", {
	enumerable: true,
	get: function() {
		return runHarnessContextEngineMaintenance;
	}
});
Object.defineProperty(exports, "waitForDeferredTurnMaintenanceForSession", {
	enumerable: true,
	get: function() {
		return waitForDeferredTurnMaintenanceForSession;
	}
});
