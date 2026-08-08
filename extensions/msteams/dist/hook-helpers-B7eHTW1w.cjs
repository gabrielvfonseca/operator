const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plain_object = require("./plain-object-CITRo0uW.cjs");
require("./utils-CXqBhRFw.cjs");
const require_diagnostic_events = require("./diagnostic-events-BfVh8qZb.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_registry = require("./registry-B6IZcEYI.cjs");
require("./types-lecpXEXr.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_errors = require("./errors-BqS4bzom.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_tool_policy = require("./tool-policy-CvMKC-hp.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
const require_hook_runner_global = require("./hook-runner-global-De_h3eqM.cjs");
require("./config-DT0qiglW.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
const require_diagnostic_error_metadata = require("./diagnostic-error-metadata-BBPy-_1-.cjs");
const require_tools = require("./tools-DryxNYgu.cjs");
const require_src = require("./src-Bt6t_5vk.cjs");
require("./client-start-readiness-CjzVtlBH.cjs");
const require_diagnostic_llm_content = require("./diagnostic-llm-content-DpdEBJOd.cjs");
const require_plugin_approvals = require("./plugin-approvals-D_TcNjGk.cjs");
const require_plugin_approval_canonical_decisions = require("./plugin-approval-canonical-decisions-Bgs1VXWI.cjs");
const require_exec_approval_surface = require("./exec-approval-surface-DwRK9eNC.cjs");
const require_source = require("./source-Bzj4-gl0.cjs");
const require_config$1 = require("./config-BmhbwvVp.cjs");
const require_curator = require("./curator-D3crpveo.cjs");
const require_service = require("./service-BJOB1VMb.cjs");
const require_agent_tools_params = require("./agent-tools.params-CnKNYuWD.cjs");
const require_run_termination = require("./run-termination-CDRVMWOn.cjs");
const require_gateway = require("./gateway-Dd-v0MLd.cjs");
const require_code_mode_control_tools = require("./code-mode-control-tools-DFxwLnU6.cjs");
const require_tool_result_error = require("./tool-result-error-CAe0MnLg.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
let node_crypto = require("node:crypto");
//#region src/plugins/hook-before-tool-call-result.ts
const PluginApprovalResolutions = {
	ALLOW_ONCE: "allow-once",
	ALLOW_ALWAYS: "allow-always",
	DENY: "deny",
	TIMEOUT: "timeout",
	CANCELLED: "cancelled"
};
//#endregion
//#region src/infra/embedded-mode.ts
let embeddedModeValue = false;
/** Sets the process-local embedded-mode flag used by UI and hosted runtimes. */
function setEmbeddedMode(value) {
	embeddedModeValue = value;
}
/** Returns whether the current process is running inside an embedded Operator host. */
function isEmbeddedMode() {
	return embeddedModeValue;
}
//#endregion
//#region src/infra/embedded-plugin-approval-broker.ts
let activeBroker = null;
var EmbeddedPluginApprovalBroker = class {
	constructor() {
		this.pending = /* @__PURE__ */ new Map();
		this.listeners = /* @__PURE__ */ new Set();
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
	listPending() {
		return [...this.pending.values()].map((entry) => entry.record);
	}
	async request(params) {
		if (params.signal?.aborted) throw params.signal.reason ?? /* @__PURE__ */ new Error("approval request aborted");
		const id = `plugin:${(0, node_crypto.randomUUID)()}`;
		const createdAtMs = Date.now();
		const record = {
			id,
			request: params.request,
			createdAtMs,
			expiresAtMs: createdAtMs + params.timeoutMs
		};
		let resolve;
		let reject;
		const decision = new Promise((resolvePromise, rejectPromise) => {
			resolve = resolvePromise;
			reject = rejectPromise;
		});
		const timer = setTimeout(() => {
			const entry = this.pending.get(id);
			if (!entry) return;
			this.pending.delete(id);
			entry.resolve(null);
			this.emit({
				event: "plugin.approval.removed",
				payload: { id }
			});
		}, params.timeoutMs);
		timer.unref?.();
		this.pending.set(id, {
			record,
			timer,
			resolve,
			reject
		});
		const abort = () => {
			const entry = this.pending.get(id);
			if (!entry) return;
			clearTimeout(entry.timer);
			this.pending.delete(id);
			entry.reject(params.signal?.reason ?? /* @__PURE__ */ new Error("approval request aborted"));
			this.emit({
				event: "plugin.approval.removed",
				payload: { id }
			});
		};
		params.signal?.addEventListener("abort", abort, { once: true });
		this.emit({
			event: "plugin.approval.requested",
			payload: record
		});
		try {
			return {
				id,
				decision: await decision
			};
		} finally {
			params.signal?.removeEventListener("abort", abort);
		}
	}
	resolve(id, decision) {
		const entry = this.pending.get(id);
		if (!entry || !require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(entry.record.request).includes(decision)) return false;
		clearTimeout(entry.timer);
		this.pending.delete(id);
		entry.resolve(decision);
		this.emit({
			event: "plugin.approval.resolved",
			payload: {
				id,
				decision,
				resolvedBy: "tui:embedded",
				ts: Date.now(),
				request: entry.record.request
			}
		});
		return true;
	}
	stop(reason = /* @__PURE__ */ new Error("embedded plugin approval broker stopped")) {
		for (const [id, entry] of this.pending) {
			clearTimeout(entry.timer);
			entry.reject(reason);
			this.emit({
				event: "plugin.approval.removed",
				payload: { id }
			});
		}
		this.pending.clear();
		this.listeners.clear();
	}
	emit(event) {
		for (const listener of this.listeners) listener(event);
	}
};
function setEmbeddedPluginApprovalBroker(broker) {
	activeBroker = broker;
}
function clearEmbeddedPluginApprovalBroker(broker) {
	if (activeBroker === broker) activeBroker = null;
}
function getEmbeddedPluginApprovalBroker() {
	return activeBroker;
}
//#endregion
//#region src/agents/apply-patch-paths.ts
/**
* Path extraction for the apply_patch envelope grammar.
* Used by pre-execution policy hooks that only need destination paths, not the
* full strict patch parser.
*/
/**
* Lightweight path extractor for the `apply_patch` envelope grammar.
*
* The full parser in `apply-patch.ts` validates and applies a patch end-to-end.
* Plugins running inside `before_tool_call` only need the destination paths so
* they can compute path policy decisions before the patch is applied. This
* helper walks the input lines and collects every path mentioned by:
*
*   - `*** Add File: <path>`
*   - `*** Update File: <path>`         (and the optional `*** Move to: <new>`
*                                         sub-marker that immediately follows)
*   - `*** Delete File: <path>`
*
* Unlike the strict parser, this helper is forgiving: it does not require the
* `*** Begin Patch` / `*** End Patch` envelope, it ignores non-marker lines
* while scanning the full input, and it may therefore still pick up marker-like
* lines that appear later in malformed input. Top-level hunk headers are matched
* after trimming leading whitespace, like the executor parser; marker-like patch
* body lines remain ignored while scanning an update hunk. Empty paths are dropped.
*
* The shape of the input mirrors how `apply_patch` receives it: either a
* string (the full patch text) or an object with an `input` field carrying the
* patch text. Anything else returns an empty array.
*/
const ADD_FILE_MARKER = "*** Add File: ";
const DELETE_FILE_MARKER = "*** Delete File: ";
const UPDATE_FILE_MARKER = "*** Update File: ";
const MOVE_TO_MARKER = "*** Move to: ";
function readPatchText(input) {
	if (typeof input === "string") return input;
	if (input && typeof input === "object" && "input" in input) {
		const candidate = input.input;
		if (typeof candidate === "string") return candidate;
	}
}
function normalizePatchPath(raw, options = {}) {
	if (raw.length === 0) return;
	const cwd = options.cwd ?? options.sandbox?.root ?? process.cwd();
	try {
		const resolved = options.sandbox ? options.sandbox.bridge.resolvePath({
			filePath: raw,
			cwd
		}) : void 0;
		const normalized = node_path.default.normalize(resolved ? resolved.hostPath ?? resolved.containerPath : require_sandbox_paths.resolveSandboxInputPath(raw, cwd));
		return normalized && normalized !== "." ? normalized : void 0;
	} catch {
		return;
	}
}
function pushPath(target, seen, raw, options) {
	const normalized = normalizePatchPath(raw, options);
	if (!normalized) return;
	if (seen.has(normalized)) return;
	seen.add(normalized);
	target.push(normalized);
}
function readMarkerPath(line, marker) {
	const candidate = normalizeMarkerHeaderLine(line);
	if (!candidate?.startsWith(marker)) return;
	return candidate.slice(marker.length);
}
function normalizeMarkerHeaderLine(line, options) {
	if (line === void 0) return;
	const startTrimmed = line.trimStart();
	if (!startTrimmed.startsWith("***")) return;
	const leadingWhitespace = line.length - startTrimmed.length;
	if (options?.allowSingleSpaceIndent === false && leadingWhitespace === 1 && line.startsWith(" ")) return;
	return startTrimmed.trimEnd();
}
/**
* Walk an apply_patch envelope and return every destination path found, in
* the order they appear. Duplicates are de-duplicated (the same file may be
* referenced multiple times within a single envelope). Returns `[]` for any
* input that is not a recognised envelope.
*/
function extractApplyPatchTargetPaths(input, options = {}) {
	const text = readPatchText(input);
	if (text === void 0 || text.length === 0) return [];
	const lines = text.split(/\r?\n/);
	const paths = [];
	const seen = /* @__PURE__ */ new Set();
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines.at(index);
		if (line === void 0) break;
		const addPath = readMarkerPath(line, ADD_FILE_MARKER);
		if (addPath !== void 0) {
			pushPath(paths, seen, addPath, options);
			while (index + 1 < lines.length && lines.at(index + 1)?.startsWith("+")) index += 1;
			continue;
		}
		const deletePath = readMarkerPath(line, DELETE_FILE_MARKER);
		if (deletePath !== void 0) {
			pushPath(paths, seen, deletePath, options);
			continue;
		}
		const updatePath = readMarkerPath(line, UPDATE_FILE_MARKER);
		if (updatePath !== void 0) {
			pushPath(paths, seen, updatePath, options);
			let lookahead = index + 1;
			while (lookahead < lines.length && lines.at(lookahead)?.trim() === "") lookahead += 1;
			const movePath = readMarkerPath(lines.at(lookahead), MOVE_TO_MARKER);
			if (movePath !== void 0) {
				pushPath(paths, seen, movePath, options);
				lookahead += 1;
			}
			while (lookahead < lines.length) {
				const lookaheadLine = lines.at(lookahead);
				if (lookaheadLine === void 0) break;
				if (lookaheadLine.trim() === "") {
					lookahead += 1;
					continue;
				}
				if (lookaheadLine.startsWith("***")) break;
				lookahead += 1;
			}
			index = lookahead - 1;
		}
	}
	return paths;
}
//#endregion
//#region src/plugins/host-tool-param-parsers.ts
/**
* Per-tool host-owned param derivers. Keep this map small and focused — every
* entry runs synchronously inside the before_tool_call hot path.
*/
const HOST_TOOL_PARAM_PARSERS = { apply_patch: (params, options) => {
	const paths = extractApplyPatchTargetPaths(params, options);
	return paths.length > 0 ? { derivedPaths: Object.freeze([...paths]) } : {};
} };
/**
* Derive host-owned metadata for a tool call. Returns an empty object when no
* parser is registered for the tool, which lets callers spread the result
* unconditionally without a nullability check.
*/
function deriveToolParams(toolName, params, options) {
	if (!Object.hasOwn(HOST_TOOL_PARAM_PARSERS, toolName)) return {};
	const parser = HOST_TOOL_PARAM_PARSERS[toolName];
	return parser ? parser(params, options) : {};
}
//#endregion
//#region src/plugins/trusted-tool-policy.ts
/** True when the supplied or active plugin registry has trusted tool policies. */
function hasTrustedToolPolicies(registry = require_runtime.getActivePluginRegistry()) {
	return copyTrustedPolicyRegistrations(registry).length > 0;
}
function unreadableTrustedPolicyRegistration() {
	return {
		pluginId: "unknown-plugin",
		source: "runtime",
		get policy() {
			throw new Error("trusted policy registration is unreadable");
		}
	};
}
function copyTrustedPolicyRegistrations(registry) {
	let policies;
	try {
		policies = registry?.trustedToolPolicies;
	} catch {
		return [unreadableTrustedPolicyRegistration()];
	}
	if (!policies) return [];
	try {
		if (!Array.isArray(policies)) return [unreadableTrustedPolicyRegistration()];
		return policies.map((policy) => policy);
	} catch {
		return [unreadableTrustedPolicyRegistration()];
	}
}
function readTrustedPolicyPluginId(registration) {
	try {
		const pluginId = registration.pluginId;
		return typeof pluginId === "string" && pluginId.trim() ? pluginId.trim() : void 0;
	} catch {
		return;
	}
}
function trustedPolicyDiagnosticPluginId(registration) {
	return readTrustedPolicyPluginId(registration) ?? "unknown-plugin";
}
function readTrustedPolicy(registration) {
	try {
		const policy = registration.policy;
		return policy && typeof policy.evaluate === "function" ? {
			ok: true,
			policy
		} : { ok: false };
	} catch {
		return { ok: false };
	}
}
function readTrustedPolicyId(registration) {
	const fallback = trustedPolicyDiagnosticPluginId(registration);
	const policy = readTrustedPolicy(registration);
	if (!policy.ok) return fallback;
	try {
		const id = policy.policy.id;
		return typeof id === "string" && id.trim() ? id.trim() : fallback;
	} catch {
		return fallback;
	}
}
function trustedPolicyDefaultBlockReason(registration) {
	return `blocked by ${readTrustedPolicyId(registration)}`;
}
function trustedPolicyFailureResult(registration, detail) {
	return {
		block: true,
		blockReason: `${trustedPolicyDefaultBlockReason(registration)}: ${detail}`
	};
}
function normalizeDerivedEventFields(value) {
	return Array.isArray(value?.derivedPaths) ? { derivedPaths: Object.freeze([...value.derivedPaths]) } : {};
}
function normalizeToolIdentity(value) {
	return {
		...value?.toolKind && { toolKind: value.toolKind },
		...value?.toolInputKind && { toolInputKind: value.toolInputKind }
	};
}
/** Runs trusted tool policies before a tool call and returns the first terminal decision. */
async function runTrustedToolPolicies(event, ctx, options) {
	const policies = copyTrustedPolicyRegistrations(options?.registry ?? require_runtime.getActivePluginRegistry());
	let adjustedParams = event.params;
	let hasAdjustedParams = false;
	let approval;
	const sessionExtensionStateCache = /* @__PURE__ */ new Map();
	let resolvedSessionConfig = options?.config;
	let didResolveSessionConfig = Boolean(options?.config);
	const resolveSessionConfig = () => {
		if (!didResolveSessionConfig) {
			didResolveSessionConfig = true;
			try {
				resolvedSessionConfig = require_io.getRuntimeConfig();
			} catch {
				resolvedSessionConfig = void 0;
			}
		}
		return resolvedSessionConfig;
	};
	const { derivedPaths, toolKind, toolInputKind, ...eventWithoutDerivedPaths } = event;
	const { toolKind: ctxToolKind, toolInputKind: ctxToolInputKind, ...ctxWithoutToolIdentity } = ctx;
	let currentDerivedEvent = normalizeDerivedEventFields({ derivedPaths });
	let currentEventToolIdentity = normalizeToolIdentity({
		toolKind,
		toolInputKind
	});
	let currentContextToolIdentity = normalizeToolIdentity({
		toolKind: ctxToolKind,
		toolInputKind: ctxToolInputKind
	});
	const buildEvent = () => {
		return {
			...eventWithoutDerivedPaths,
			params: adjustedParams,
			...currentEventToolIdentity,
			...currentDerivedEvent
		};
	};
	for (const registration of policies) {
		const pluginId = readTrustedPolicyPluginId(registration);
		if (!pluginId) return trustedPolicyFailureResult(registration, "policy owner is unreadable");
		const policyCtx = {
			...ctxWithoutToolIdentity,
			...currentContextToolIdentity,
			getSessionExtension: (namespace) => {
				const normalizedNamespace = namespace.trim();
				const cacheKey = pluginId;
				if (!sessionExtensionStateCache.has(cacheKey)) {
					const config = ctx.sessionKey ? resolveSessionConfig() : void 0;
					sessionExtensionStateCache.set(cacheKey, config ? require_registry.getPluginSessionExtensionStateSync({
						cfg: config,
						pluginId,
						sessionKey: ctx.sessionKey
					}) : void 0);
				}
				const pluginState = sessionExtensionStateCache.get(cacheKey);
				if (!normalizedNamespace || !pluginState) return;
				return pluginState[normalizedNamespace];
			}
		};
		const policy = readTrustedPolicy(registration);
		if (!policy.ok) return trustedPolicyFailureResult(registration, "policy is unreadable");
		let decision;
		try {
			decision = await policy.policy.evaluate(buildEvent(), policyCtx);
		} catch {
			return trustedPolicyFailureResult(registration, "policy evaluation failed");
		}
		if (!decision) continue;
		try {
			if ("allow" in decision && decision.allow === false) return {
				block: true,
				blockReason: decision.reason ?? trustedPolicyDefaultBlockReason(registration)
			};
			if ("block" in decision && decision.block === true) return {
				...decision,
				blockReason: decision.blockReason ?? trustedPolicyDefaultBlockReason(registration)
			};
			if ("params" in decision && require_plain_object.isPlainObject(decision.params)) {
				const normalized = options?.normalizeEvent?.({
					...eventWithoutDerivedPaths,
					params: decision.params,
					...currentEventToolIdentity,
					...currentDerivedEvent
				}, policyCtx);
				adjustedParams = normalized?.params ?? decision.params;
				if (normalized?.event) currentEventToolIdentity = normalizeToolIdentity(normalized.event);
				if (normalized?.ctx) currentContextToolIdentity = normalizeToolIdentity(normalized.ctx);
				else if (normalized?.event) currentContextToolIdentity = normalizeToolIdentity(normalized.event);
				hasAdjustedParams = true;
				currentDerivedEvent = normalizeDerivedEventFields(options?.deriveEvent?.(adjustedParams));
			}
			if ("requireApproval" in decision && decision.requireApproval && !approval) approval = decision.requireApproval;
		} catch {
			return trustedPolicyFailureResult(registration, "policy decision is unreadable");
		}
	}
	if (!hasAdjustedParams && !approval) return;
	return {
		...hasAdjustedParams ? { params: adjustedParams } : {},
		...approval ? { requireApproval: approval } : {}
	};
}
//#endregion
//#region src/skills/workshop/policy.ts
const SKILL_WORKSHOP_LIFECYCLE_ACTIONS = /* @__PURE__ */ new Set([
	"apply",
	"reject",
	"quarantine"
]);
const SKILL_WORKSHOP_APPROVAL_TIMEOUT_MS = 7e4;
function readLifecycleAction(params) {
	const action = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(params)?.action;
	if (typeof action !== "string" || !SKILL_WORKSHOP_LIFECYCLE_ACTIONS.has(action)) return;
	return action;
}
function lifecycleApprovalText(action) {
	if (action === "apply") return {
		title: "Apply workspace skill proposal",
		description: "Apply a pending workspace skill proposal into live workspace skills.",
		severity: "warning"
	};
	if (action === "reject") return {
		title: "Reject workspace skill proposal",
		description: "Reject a pending workspace skill proposal.",
		severity: "info"
	};
	return {
		title: "Quarantine workspace skill proposal",
		description: "Quarantine a pending workspace skill proposal.",
		severity: "info"
	};
}
function readOptionalString(record, key) {
	const value = record?.[key];
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function formatBodySizeKb(content) {
	return (Buffer.byteLength(content, "utf8") / 1024).toFixed(1);
}
function formatApprovalField(value) {
	return value.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, (character) => character === "\n" || character === "\r" || character === "\u2028" || character === "\u2029" ? "↵" : "�");
}
function buildLifecycleApprovalDescription(params) {
	const description = formatApprovalField(params.description);
	const requestedSkillName = formatApprovalField(params.skillName);
	const fixedLines = [
		`Proposal ID: ${params.proposalId}`,
		`Description: ${description}`,
		`Support files: ${params.supportFileCount}`,
		`Body size: ${params.bodySizeKb} KB`
	];
	const skillPrefix = "Target skill: ";
	const fixedLength = fixedLines.join("\n").length + 14 + fixedLines.length;
	const availableSkillNameLength = Math.max(1, 512 - fixedLength);
	const skillName = requestedSkillName.length <= availableSkillNameLength ? requestedSkillName : `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(requestedSkillName, Math.max(0, availableSkillNameLength - 1))}…`;
	return [
		fixedLines[0],
		`${skillPrefix}${skillName}`,
		...fixedLines.slice(1)
	].join("\n");
}
async function resolveLifecycleApprovalDescription(params) {
	if (!params.workspaceDir) return { description: params.fallback };
	const toolParams = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(params.toolParams);
	try {
		const proposal = await require_service.resolvePendingSkillProposal({
			proposalId: readOptionalString(toolParams, "proposal_id"),
			name: readOptionalString(toolParams, "name"),
			workspaceDir: params.workspaceDir
		});
		const record = proposal.record;
		return {
			description: buildLifecycleApprovalDescription({
				proposalId: record.id,
				skillName: record.target.skillName,
				description: record.description,
				supportFileCount: record.supportFiles?.length ?? 0,
				bodySizeKb: formatBodySizeKb(proposal.content)
			}),
			proposalId: record.id
		};
	} catch {
		return { description: params.fallback };
	}
}
function lifecycleApprovalTimeoutReason(proposalId) {
	return [
		"The Skill Workshop approval request expired without a decision.",
		`This lifecycle call left ${proposalId ? `Proposal ${proposalId}` : "the proposal"} unchanged and pending; check its current status in case another operator acted on it.`,
		"Decide in the Skill Workshop UI or run `operator skills workshop apply|reject|quarantine <id>`.",
		"Do not retry this tool call in a loop."
	].join(" ");
}
function resolveApprovalConfig(config) {
	if (config) return config;
	try {
		return require_io.getRuntimeConfig();
	} catch {
		return;
	}
}
/** Returns approval policy for skill workshop lifecycle tool calls. */
async function resolveSkillWorkshopToolApproval(params) {
	if (params.toolName !== "skill_workshop") return;
	const action = readLifecycleAction(params.toolParams);
	if (!action) return;
	if (require_config$1.resolveSkillWorkshopConfig(resolveApprovalConfig(params.config)).approvalPolicy === "auto") return;
	const text = lifecycleApprovalText(action);
	const approvalDescription = await resolveLifecycleApprovalDescription({
		toolParams: params.toolParams,
		workspaceDir: params.workspaceDir,
		fallback: text.description
	});
	return { requireApproval: {
		...text,
		description: approvalDescription.description,
		timeoutMs: SKILL_WORKSHOP_APPROVAL_TIMEOUT_MS,
		timeoutReason: lifecycleApprovalTimeoutReason(approvalDescription.proposalId),
		allowedDecisions: ["allow-once", "deny"]
	} };
}
//#endregion
//#region src/agents/agent-tools.before-tool-call.state.ts
/**
* Shared before_tool_call state for adjusted tool params.
* The adapter and wrapper both consult this map so later execution can use the
* normalized payload selected by hook processing.
*/
const adjustedParamsByToolCallId = /* @__PURE__ */ new Map();
const preExecutionBlockedToolCallIds = /* @__PURE__ */ new Set();
const structuredReplaySafeToolCallIds = /* @__PURE__ */ new Set();
const startedToolCallIds = /* @__PURE__ */ new Set();
const trackedToolCallIds = /* @__PURE__ */ new Set();
function buildAdjustedParamsKey(params) {
	if (params.runId?.trim()) return `${params.runId}:${params.toolCallId}`;
	return params.toolCallId;
}
/** Consume and remove hook-adjusted params for a completed tool call. */
function consumeAdjustedParamsForToolCall(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const params = adjustedParamsByToolCallId.get(key);
	adjustedParamsByToolCallId.delete(key);
	return params;
}
/** Snapshot hook-adjusted params without consuming later outcome bookkeeping. */
function peekAdjustedParamsForToolCall(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const params = adjustedParamsByToolCallId.get(key);
	return params === void 0 ? void 0 : structuredClone(params);
}
/** Consume whether policy prevented the target tool from starting. */
function consumePreExecutionBlockedToolCall(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const blocked = preExecutionBlockedToolCallIds.has(key);
	preExecutionBlockedToolCallIds.delete(key);
	return blocked;
}
/** Snapshot whether policy prevented execution without stealing cleanup from the tool owner. */
function peekPreExecutionBlockedToolCall(toolCallId, runId) {
	return preExecutionBlockedToolCallIds.has(buildAdjustedParamsKey({
		runId,
		toolCallId
	}));
}
/** Record active wrapper ownership so a racing timeout can inspect the boundary. */
function recordToolExecutionTracked(toolCallId, runId) {
	trackedToolCallIds.add(buildAdjustedParamsKey({
		runId,
		toolCallId
	}));
}
function recordToolExecutionStarted(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	trackedToolCallIds.add(key);
	startedToolCallIds.add(key);
}
/** Release execution-boundary evidence when the wrapped invocation settles. */
function clearTrackedToolExecution(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	trackedToolCallIds.delete(key);
	startedToolCallIds.delete(key);
}
/**
* Consume exact in-flight execution state. Undefined means the wrapper already
* settled or the producer does not participate in Operator boundary tracking.
*/
function consumeTrackedToolExecutionStarted(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const tracked = trackedToolCallIds.has(key);
	const started = startedToolCallIds.has(key);
	clearTrackedToolExecution(toolCallId, runId);
	return tracked ? started : void 0;
}
function recordStructuredReplaySafeToolCall(toolCallId, runId) {
	structuredReplaySafeToolCallIds.add(buildAdjustedParamsKey({
		runId,
		toolCallId
	}));
}
function consumeStructuredReplaySafeToolCall(toolCallId, runId) {
	const key = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const replaySafe = structuredReplaySafeToolCallIds.has(key);
	structuredReplaySafeToolCallIds.delete(key);
	return replaySafe;
}
//#endregion
//#region src/agents/agent-tools.before-tool-call.ts
/**
* before_tool_call policy runtime for agent tools.
* Runs plugin hooks, trusted tool policies, approvals, diagnostics, loop
* detection, skill-use telemetry, and adjusted parameter tracking.
*/
function resolvePluginToolApprovalTimeoutMs(approval) {
	if (typeof approval.timeoutMs !== "number" || !Number.isFinite(approval.timeoutMs) || approval.timeoutMs <= 0) return require_plugin_approvals.DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS;
	return Math.min(Math.floor(approval.timeoutMs), require_plugin_approvals.MAX_PLUGIN_APPROVAL_TIMEOUT_MS);
}
function resolvePluginToolApprovalGatewayTimeoutMs(timeoutMs) {
	return (0, _gabrielvfonseca_normalization_core_number_coercion.addTimerTimeoutGraceMs)(timeoutMs, 1e4) ?? 13e4;
}
const log$1 = require_subsystem.createSubsystemLogger("agents/tools");
const BEFORE_TOOL_CALL_HOOK_FAILURE_REASON = "Tool call blocked because before_tool_call hook failed";
const MAX_TRACKED_ADJUSTED_PARAMS = 1024;
const MAX_PENDING_TERMINAL_PRESENTATIONS = 1024;
const LOOP_WARNING_BUCKET_SIZE = 10;
const MAX_LOOP_WARNING_KEYS = 256;
const MAX_TERMINAL_PRESENTATION_CHARS = 2e3;
const pendingTerminalPresentationByToolCall = /* @__PURE__ */ new Map();
function resolveToolTerminalPresentation(params) {
	try {
		const sourceTool = params.tool[require_gateway.BEFORE_TOOL_CALL_SOURCE_TOOL];
		const text = require_gateway.getToolTerminalPresentation(sourceTool && typeof sourceTool === "object" ? sourceTool : params.tool)?.(params.toolParams, params.result)?.text.trim();
		if (!text) return;
		return (0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(require_redact.redactToolDetail(text), MAX_TERMINAL_PRESENTATION_CHARS);
	} catch (err) {
		log$1.warn(`terminal tool presentation failed: tool=${params.tool.name || "tool"} error=${String(err)}`);
		return;
	}
}
function rememberPendingTerminalPresentation(params) {
	if (!params.toolCallId || !params.ctx?.onToolOutcome) return;
	const key = buildAdjustedParamsKey({
		runId: params.ctx.runId,
		toolCallId: params.toolCallId
	});
	pendingTerminalPresentationByToolCall.set(key, {
		observer: params.ctx.onToolOutcome,
		tool: params.tool,
		toolParams: structuredClone(params.toolParams),
		toolCallOrdinal: params.toolCallOrdinal
	});
	while (pendingTerminalPresentationByToolCall.size > MAX_PENDING_TERMINAL_PRESENTATIONS) {
		const oldestKey = pendingTerminalPresentationByToolCall.keys().next().value;
		if (!oldestKey) break;
		pendingTerminalPresentationByToolCall.delete(oldestKey);
	}
}
/** Finalizes a trusted terminal summary after harness result middleware. */
function finalizeToolTerminalPresentation(params) {
	const key = buildAdjustedParamsKey({
		runId: params.runId,
		toolCallId: params.toolCallId
	});
	const pending = pendingTerminalPresentationByToolCall.get(key);
	pendingTerminalPresentationByToolCall.delete(key);
	const observer = pending?.observer ?? params.observer;
	if (!observer) return;
	const toolCallOrdinal = pending?.toolCallOrdinal ?? params.toolCallOrdinal;
	observer({
		toolName: pending?.tool.name || params.toolName || "tool",
		argsHash: "",
		resultHash: "",
		...toolCallOrdinal !== void 0 ? { toolCallOrdinal } : {},
		terminalPresentation: params.isError ? void 0 : pending ? resolveToolTerminalPresentation({
			tool: pending.tool,
			toolParams: pending.toolParams,
			result: params.result
		}) : void 0,
		presentationOnly: true
	});
}
/**
* Error used when before_tool_call intentionally vetoes a tool call.
*/
var BeforeToolCallBlockedError = class extends Error {
	constructor(reason) {
		super(reason);
		this.reason = reason;
		this.name = "BeforeToolCallBlockedError";
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.beforeToolCallBlockedErrorTestApi")] = { create(message) {
	return new BeforeToolCallBlockedError(message);
} };
var BeforeToolCallFailureError = class extends Error {
	constructor(message, disposition, cause) {
		super(message, cause === void 0 ? void 0 : { cause });
		this.disposition = disposition;
		this.name = "BeforeToolCallFailureError";
	}
};
function tagBeforeToolCallFailure(error, signal) {
	try {
		if (error instanceof BeforeToolCallFailureError) return error;
	} catch {}
	const message = require_tool_result_error.formatToolExecutionErrorMessage(error, "before_tool_call failed");
	const disposition = resolveToolErrorDiagnostic(error, signal).terminalReason;
	return new BeforeToolCallFailureError(message, disposition, error);
}
/** Remember hook-adjusted params for later adapter-side execution. */
function recordAdjustedParamsForToolCall(toolCallId, params, runId) {
	if (!toolCallId) return;
	const cloneResult = cloneParamsForAdjustedReplay(params);
	if (!cloneResult.ok) return;
	const adjustedParamsKey = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	adjustedParamsByToolCallId.set(adjustedParamsKey, cloneResult.value);
	if (adjustedParamsByToolCallId.size > MAX_TRACKED_ADJUSTED_PARAMS) {
		const oldest = adjustedParamsByToolCallId.keys().next().value;
		if (oldest) adjustedParamsByToolCallId.delete(oldest);
	}
}
function cloneParamsForAdjustedReplay(params) {
	try {
		return {
			ok: true,
			value: structuredClone(params)
		};
	} catch {
		return { ok: false };
	}
}
/** Record that one concrete core-owned tool call may use structured replay classification. */
function recordStructuredReplayTrustForToolCall(toolCallId, tool, runId) {
	if (!toolCallId || require_tools.getPluginToolMeta(tool) || require_gateway.getChannelAgentToolMeta(tool)) return;
	recordStructuredReplaySafeToolCall(toolCallId, runId);
	while (structuredReplaySafeToolCallIds.size > MAX_TRACKED_ADJUSTED_PARAMS) {
		const oldest = structuredReplaySafeToolCallIds.values().next().value;
		if (!oldest) break;
		structuredReplaySafeToolCallIds.delete(oldest);
	}
}
/**
* Returns true when an error represents an intentional before_tool_call veto.
*/
function isBeforeToolCallBlockedError(err) {
	return err instanceof BeforeToolCallBlockedError;
}
const loadBeforeToolCallRuntime = require_lazy_runtime.createLazyRuntimeSurface(() => Promise.resolve().then(() => require("./agent-tools.before-tool-call.runtime-RRolW05l.cjs")), ({ beforeToolCallRuntime }) => beforeToolCallRuntime);
function mergeParamsWithApprovalOverrides(originalParams, approvalParams) {
	if (approvalParams && require_plain_object.isPlainObject(approvalParams)) {
		if (require_plain_object.isPlainObject(originalParams)) return {
			...originalParams,
			...approvalParams
		};
		return approvalParams;
	}
	return originalParams;
}
function unwrapErrorCause(err) {
	try {
		if (!(err instanceof Error)) return err;
		const cause = Object.getOwnPropertyDescriptor(err, "cause");
		if (cause && "value" in cause && cause.value !== void 0) return cause.value;
	} catch {
		return err;
	}
	return err;
}
function resolveToolErrorDiagnostic(err, signal, errorCategory) {
	const cause = unwrapErrorCause(err);
	const errorCode = require_diagnostic_error_metadata.diagnosticHttpStatusCode(cause);
	const abortFields = require_run_termination.resolveAgentRunAbortLifecycleFields(signal);
	const terminalReason = !abortFields.aborted ? require_tool_result_error.resolveToolExecutionErrorKind(cause) : abortFields.stopReason === "timeout" ? "timed_out" : "cancelled";
	return {
		errorCategory: terminalReason === "cancelled" ? "aborted" : errorCategory ?? require_diagnostic_error_metadata.diagnosticErrorCategory(cause),
		terminalReason,
		...errorCode ? { errorCode } : {}
	};
}
function resolveToolResultTerminalDiagnostic(result, durationMs) {
	const failureKind = require_tool_result_error.resolveToolResultFailureKind(result);
	if (!failureKind) return {
		type: "tool.execution.completed",
		durationMs
	};
	if (failureKind === "blocked") return {
		type: "tool.execution.blocked",
		deniedReason: "tool_result_blocked",
		reason: "tool_result_blocked"
	};
	return {
		type: "tool.execution.error",
		durationMs,
		errorCategory: "tool_result_error",
		terminalReason: failureKind
	};
}
function resolveToolDiagnosticIdentity(tool) {
	const pluginMeta = require_tools.getPluginToolMeta(tool);
	if (pluginMeta) return pluginMeta.pluginId === "bundle-mcp" ? {
		toolSource: "mcp",
		toolOwner: pluginMeta.pluginId
	} : {
		toolSource: "plugin",
		toolOwner: pluginMeta.pluginId
	};
	const channelMeta = require_gateway.getChannelAgentToolMeta(tool);
	if (channelMeta) return {
		toolSource: "channel",
		toolOwner: channelMeta.channelId
	};
	return { toolSource: "core" };
}
function canonicalSkillFile(value) {
	const skillFile = value?.trim();
	return skillFile && node_path.default.isAbsolute(skillFile) ? require_curator.canonicalizePath(node_path.default.resolve(skillFile)) : void 0;
}
function resolvedSkillUsageMatch(params) {
	const skillFile = canonicalSkillFile(params.skill.filePath);
	return {
		skillName: params.skill.name.trim(),
		skillSource: require_source.resolveSkillTelemetrySource(params.skill),
		activation: params.activation,
		...skillFile ? { skillFile } : {}
	};
}
function findResolvedSkillUsageMatch(params) {
	const skillName = params.skillName.trim();
	const candidates = (params.snapshot?.resolvedSkills ?? []).filter((skill) => skill.name.trim() === skillName);
	const skill = candidates.find((candidate) => require_source.resolveSkillTelemetrySource(candidate) === params.skillSource) ?? (candidates.length === 1 ? candidates[0] : void 0);
	return skill ? resolvedSkillUsageMatch({
		activation: params.activation,
		skill
	}) : void 0;
}
function resolveRelativeToolPath(candidate, ctx) {
	const trimmed = candidate.trim();
	if (!trimmed) return;
	if (trimmed.startsWith("node://")) return trimmed;
	if (trimmed === "~") return node_os.default.homedir();
	if (trimmed.startsWith("~/")) return node_path.default.resolve(node_os.default.homedir(), trimmed.slice(2));
	if (node_path.default.isAbsolute(trimmed)) return node_path.default.resolve(trimmed);
	const base = ctx?.workspaceDir ?? ctx?.cwd;
	return base ? node_path.default.resolve(base, trimmed) : void 0;
}
function readToolPathCandidates(params, ctx) {
	if (!require_plain_object.isPlainObject(params)) return [];
	return (typeof params.path === "string" ? [params.path] : []).map((candidate) => resolveRelativeToolPath(require_agent_tools_params.normalizeFileToolPathParam(candidate), ctx)).filter((candidate) => Boolean(candidate));
}
function skillInstructionPaths(snapshot) {
	const matches = /* @__PURE__ */ new Map();
	for (const skill of snapshot?.resolvedSkills ?? []) {
		if (!(typeof skill.name === "string" ? skill.name.trim() : "")) continue;
		const match = resolvedSkillUsageMatch({
			activation: "read",
			skill
		});
		const filePath = typeof skill.filePath === "string" ? skill.filePath.trim() : "";
		if (filePath) {
			if (filePath.startsWith("node://")) matches.set(filePath, match);
			else if (node_path.default.isAbsolute(filePath)) matches.set(node_path.default.resolve(filePath), match);
		}
		const baseDir = typeof skill.baseDir === "string" ? skill.baseDir.trim() : "";
		if (baseDir && node_path.default.isAbsolute(baseDir)) matches.set(node_path.default.resolve(baseDir, "SKILL.md"), match);
	}
	return matches;
}
function materializedSkillInstructionPaths(paths) {
	const matches = /* @__PURE__ */ new Map();
	for (const entry of paths ?? []) matches.set(node_path.default.resolve(entry.readPath), {
		skillFile: entry.skillFile,
		skillName: entry.skillName,
		skillSource: entry.skillSource,
		activation: "read"
	});
	return matches;
}
function findSkillUsageMatch(params) {
	const command = params.ctx?.skillCommand;
	if (command) {
		const commandToolName = require_tool_policy.normalizeToolName(command.toolName ?? params.toolName);
		if (!commandToolName || commandToolName === params.toolName) {
			const skillSource = require_source.resolveSkillTelemetrySourceValue(command.skillSource);
			const snapshotMatch = findResolvedSkillUsageMatch({
				activation: "command",
				skillName: command.skillName,
				skillSource,
				snapshot: params.ctx?.skillsSnapshot
			});
			const skillFile = canonicalSkillFile(command.skillFile) ?? snapshotMatch?.skillFile;
			return {
				skillName: command.skillName,
				skillSource,
				activation: "command",
				...skillFile ? { skillFile } : {}
			};
		}
	}
	if (params.toolName !== "read") return;
	const skillPaths = params.ctx?.skillsSnapshot?.resolvedSkills?.length ? skillInstructionPaths(params.ctx.skillsSnapshot) : materializedSkillInstructionPaths(params.ctx?.skillUsagePaths);
	for (const candidate of readToolPathCandidates(params.toolParams, params.ctx)) {
		const match = skillPaths.get(candidate);
		if (match) return match;
	}
}
function emitSkillUsedDiagnostic(params) {
	const trace = params.ctx?.trace ? require_diagnostic_events.freezeDiagnosticTraceContext(require_diagnostic_events.createChildDiagnosticTraceContext(params.ctx.trace)) : void 0;
	require_diagnostic_events.emitTrustedSkillUsedDiagnosticEvent({
		type: "skill.used",
		...params.ctx?.runId && { runId: params.ctx.runId },
		...params.ctx?.sessionKey && { sessionKey: params.ctx.sessionKey },
		...params.ctx?.sessionId && { sessionId: params.ctx.sessionId },
		...params.ctx?.agentId && { agentId: params.ctx.agentId },
		...trace && { trace },
		skillName: params.match.skillName,
		skillSource: params.match.skillSource,
		activation: params.match.activation,
		toolName: params.toolName,
		...params.toolCallId && { toolCallId: params.toolCallId }
	}, params.match.skillFile ? { skillUsage: { skillFile: params.match.skillFile } } : void 0);
}
function emitToolBlockedSecurityEvent(params) {
	const control = params.deniedReason === "tool-loop" ? {
		policyId: "tool-loop-detection",
		controlId: "tool-loop-detection",
		family: "authorization"
	} : params.deniedReason === "plugin-approval" ? {
		policyId: "plugin-tool-approval",
		controlId: "plugin-tool-approval",
		family: "approval"
	} : {
		policyId: "plugin-before-tool-call",
		controlId: "before-tool-call",
		family: "approval"
	};
	require_diagnostic_events.emitTrustedSecurityEvent({
		category: "tool",
		action: "tool.execution.blocked",
		outcome: "denied",
		severity: "medium",
		reason: params.deniedReason,
		...params.trace ? { trace: params.trace } : {},
		actor: { kind: "agent" },
		target: {
			kind: "tool",
			name: params.toolName,
			...params.toolIdentity.toolOwner ? { owner: params.toolIdentity.toolOwner } : {}
		},
		policy: {
			id: control.policyId,
			decision: "deny",
			reason: params.deniedReason
		},
		control: {
			id: control.controlId,
			family: control.family
		},
		attributes: {
			tool_source: params.toolIdentity.toolSource,
			...params.paramsSummary ? { params_kind: params.paramsSummary.kind } : {}
		}
	});
}
const warnedDeprecatedTimeoutBehaviorPluginIds = /* @__PURE__ */ new Set();
function warnDeprecatedApprovalTimeoutBehavior(approval) {
	if (approval.timeoutBehavior !== "allow") return;
	const pluginId = approval.pluginId ?? "unknown-plugin";
	if (warnedDeprecatedTimeoutBehaviorPluginIds.has(pluginId)) return;
	warnedDeprecatedTimeoutBehaviorPluginIds.add(pluginId);
	log$1.warn(`plugin '${pluginId}' sets deprecated requireApproval.timeoutBehavior:"allow"; the field is ignored and approvals fail closed on timeout (see docs/plugins/plugin-permission-requests.md)`);
}
function notifyPluginApprovalResolution(approval, resolution) {
	const onResolution = approval.onResolution;
	if (typeof onResolution !== "function") return;
	try {
		Promise.resolve(onResolution(resolution)).catch((err) => {
			log$1.warn(`plugin onResolution callback failed: ${String(err)}`);
		});
	} catch (err) {
		log$1.warn(`plugin onResolution callback failed: ${String(err)}`);
	}
}
function resolvePermittedPluginApprovalResolution(decision, allowedDecisions) {
	if ((decision === PluginApprovalResolutions.ALLOW_ONCE || decision === PluginApprovalResolutions.ALLOW_ALWAYS || decision === PluginApprovalResolutions.DENY) && allowedDecisions.includes(decision)) return decision;
	return PluginApprovalResolutions.TIMEOUT;
}
function buildPluginApprovalFailureReason(params) {
	const turnSourceChannel = params.ctx?.turnSourceChannel;
	if (!turnSourceChannel?.trim()) return params.fallbackReason;
	const nativePluginSurface = require_exec_approval_surface.resolveApprovalInitiatingSurfaceState({
		channel: turnSourceChannel,
		accountId: params.ctx?.turnSourceAccountId,
		cfg: params.ctx?.config,
		approvalKind: "plugin"
	});
	const setupText = require_exec_approval_surface.describeNativePluginApprovalClientSetup({
		channel: nativePluginSurface.channel,
		channelLabel: nativePluginSurface.channelLabel,
		accountId: nativePluginSurface.accountId
	});
	if (!setupText) return params.fallbackReason;
	if ((nativePluginSurface.kind === "disabled" ? nativePluginSurface : require_exec_approval_surface.resolveApprovalInitiatingSurfaceState({
		channel: turnSourceChannel,
		accountId: params.ctx?.turnSourceAccountId,
		cfg: params.ctx?.config,
		approvalKind: "exec"
	})).kind !== "disabled") return params.fallbackReason;
	return `${params.fallbackReason}\n\n${setupText}`;
}
async function requestPluginToolApproval(params) {
	const approval = params.approval;
	const timeoutMs = resolvePluginToolApprovalTimeoutMs(approval);
	const gatewayTimeoutMs = resolvePluginToolApprovalGatewayTimeoutMs(timeoutMs);
	const allowedDecisions = require_plugin_approval_canonical_decisions.resolveCanonicalPluginApprovalRequestAllowedDecisions(approval);
	let gatewayApprovalPhase = "none";
	try {
		const embeddedApprovalBroker = isEmbeddedMode() ? getEmbeddedPluginApprovalBroker() : null;
		if (embeddedApprovalBroker) {
			const decision = (await embeddedApprovalBroker.request({
				request: {
					pluginId: approval.pluginId,
					title: approval.title,
					description: approval.description,
					severity: approval.severity,
					allowedDecisions: approval.allowedDecisions,
					toolName: params.toolName,
					toolCallId: params.toolCallId,
					agentId: params.ctx?.agentId,
					sessionKey: params.ctx?.sessionKey,
					turnSourceChannel: params.ctx?.turnSourceChannel,
					turnSourceTo: params.ctx?.turnSourceTo,
					turnSourceAccountId: params.ctx?.turnSourceAccountId,
					turnSourceThreadId: params.ctx?.turnSourceThreadId
				},
				timeoutMs,
				signal: params.signal
			})).decision;
			const resolution = resolvePermittedPluginApprovalResolution(decision, allowedDecisions);
			notifyPluginApprovalResolution(approval, resolution);
			if (resolution === PluginApprovalResolutions.ALLOW_ONCE || resolution === PluginApprovalResolutions.ALLOW_ALWAYS) return {
				blocked: false,
				params: mergeParamsWithApprovalOverrides(params.baseParams, params.overrideParams),
				approvalResolution: resolution
			};
			if (resolution === PluginApprovalResolutions.DENY) return {
				blocked: true,
				kind: "failure",
				disposition: "blocked",
				deniedReason: "plugin-approval",
				reason: "Denied by user",
				params: params.baseParams
			};
			return approval.timeoutReason ? {
				blocked: true,
				kind: "veto",
				deniedReason: "plugin-approval",
				reason: approval.timeoutReason,
				params: params.baseParams
			} : {
				blocked: true,
				kind: "failure",
				disposition: "timed_out",
				deniedReason: "plugin-approval",
				reason: "Approval timed out",
				params: params.baseParams
			};
		}
		gatewayApprovalPhase = "request";
		const requestResult = await require_gateway.callGatewayTool("plugin.approval.request", { timeoutMs: gatewayTimeoutMs }, {
			pluginId: approval.pluginId,
			title: approval.title,
			description: approval.description,
			severity: approval.severity,
			allowedDecisions: approval.allowedDecisions,
			toolName: params.toolName,
			toolCallId: params.toolCallId,
			agentId: params.ctx?.agentId,
			sessionKey: params.ctx?.sessionKey,
			...params.ctx?.approvalReviewerDeviceId ? { approvalReviewerDeviceIds: [params.ctx.approvalReviewerDeviceId] } : {},
			turnSourceChannel: params.ctx?.turnSourceChannel,
			turnSourceTo: params.ctx?.turnSourceTo,
			turnSourceAccountId: params.ctx?.turnSourceAccountId,
			turnSourceThreadId: params.ctx?.turnSourceThreadId,
			timeoutMs,
			twoPhase: true
		}, { expectFinal: false });
		gatewayApprovalPhase = "none";
		const id = requestResult?.id;
		if (!id) {
			notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
			return {
				blocked: true,
				kind: "failure",
				disposition: "failed",
				deniedReason: "plugin-approval",
				reason: approval.description || "Plugin approval request failed",
				params: params.baseParams
			};
		}
		const hasImmediateDecision = Object.hasOwn(requestResult ?? {}, "decision");
		let decision;
		if (hasImmediateDecision) {
			decision = requestResult?.decision;
			if (decision === null) {
				notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
				return {
					blocked: true,
					kind: "failure",
					disposition: "failed",
					deniedReason: "plugin-approval",
					reason: buildPluginApprovalFailureReason({
						fallbackReason: "Plugin approval unavailable (no approval route)",
						ctx: params.ctx
					}),
					params: params.baseParams
				};
			}
		} else {
			gatewayApprovalPhase = "wait";
			const waitPromise = require_gateway.callGatewayTool("plugin.approval.waitDecision", { timeoutMs: gatewayTimeoutMs }, { id });
			let waitResult;
			if (params.signal) {
				let onAbort;
				const abortPromise = new Promise((_, reject) => {
					if (params.signal.aborted) {
						reject(toLintErrorObject(params.signal.reason, "Non-Error rejection"));
						return;
					}
					onAbort = () => reject(toLintErrorObject(params.signal.reason, "Non-Error rejection"));
					params.signal.addEventListener("abort", onAbort, { once: true });
				});
				try {
					waitResult = await Promise.race([waitPromise, abortPromise]);
				} finally {
					if (onAbort) params.signal.removeEventListener("abort", onAbort);
				}
			} else waitResult = await waitPromise;
			decision = waitResult?.id === id ? waitResult.decision : void 0;
		}
		const resolution = resolvePermittedPluginApprovalResolution(decision, allowedDecisions);
		notifyPluginApprovalResolution(approval, resolution);
		if (resolution === PluginApprovalResolutions.ALLOW_ONCE || resolution === PluginApprovalResolutions.ALLOW_ALWAYS) return {
			blocked: false,
			params: mergeParamsWithApprovalOverrides(params.baseParams, params.overrideParams),
			approvalResolution: resolution
		};
		if (resolution === PluginApprovalResolutions.DENY) return {
			blocked: true,
			kind: "failure",
			disposition: "blocked",
			deniedReason: "plugin-approval",
			reason: "Denied by user",
			params: params.baseParams
		};
		const fallbackTimeoutReason = approval.timeoutReason ?? "Approval timed out";
		const timeoutReason = requestResult?.deliveryRoute === "turn-source" ? buildPluginApprovalFailureReason({
			fallbackReason: fallbackTimeoutReason,
			ctx: params.ctx
		}) : fallbackTimeoutReason;
		return {
			blocked: true,
			kind: approval.timeoutReason ? "veto" : "failure",
			disposition: "timed_out",
			deniedReason: "plugin-approval",
			reason: timeoutReason,
			params: params.baseParams
		};
	} catch (err) {
		notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
		const signal = params.signal;
		if (signal?.aborted === true && (err === signal.reason || err instanceof Error && (err.name === "AbortError" || "cause" in err && err.cause === signal.reason))) {
			log$1.warn(`plugin approval wait cancelled by run abort: ${String(err)}`);
			return {
				blocked: true,
				kind: "failure",
				disposition: resolveToolErrorDiagnostic(err, signal).terminalReason,
				deniedReason: "plugin-approval",
				reason: "Approval cancelled (run aborted)",
				params: params.baseParams
			};
		}
		const invalidRequest = err instanceof require_src.GatewayClientRequestError && err.gatewayCode === "INVALID_REQUEST";
		const reason = invalidRequest && gatewayApprovalPhase === "request" ? `Plugin approval request rejected: ${require_errors.formatErrorMessage(err)}` : invalidRequest && gatewayApprovalPhase === "wait" ? `Plugin approval no longer available: ${require_errors.formatErrorMessage(err)}` : "Plugin approval required (gateway unavailable)";
		log$1.warn(`plugin approval gateway request failed; blocking tool call: ${String(err)}`);
		return {
			blocked: true,
			kind: "failure",
			disposition: resolveToolErrorDiagnostic(err, signal).terminalReason,
			deniedReason: "plugin-approval",
			reason,
			params: params.baseParams
		};
	}
}
/** Notify plugin approval callbacks that a deferred approval was cancelled. */
function cancelDeferredPluginToolApproval(deferredApproval) {
	notifyPluginApprovalResolution(deferredApproval.approval, PluginApprovalResolutions.CANCELLED);
}
async function resolveBeforeToolCallApprovalOutcome(params) {
	const approval = params.result?.requireApproval;
	if (!approval) return;
	warnDeprecatedApprovalTimeoutBehavior(approval);
	if (params.approvalMode === "defer") return {
		blocked: false,
		params: params.baseParams,
		deferredApproval: {
			approval,
			toolName: params.toolName,
			...params.toolCallId ? { toolCallId: params.toolCallId } : {},
			...params.ctx ? { ctx: params.ctx } : {},
			baseParams: params.baseParams,
			overrideParams: params.result?.params
		}
	};
	if (params.approvalMode === "report") {
		notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
		return {
			blocked: true,
			kind: "failure",
			disposition: "blocked",
			deniedReason: "plugin-approval",
			reason: approval.description || approval.title || "Plugin approval required",
			params: params.baseParams
		};
	}
	return await requestPluginToolApproval({
		approval,
		toolName: params.toolName,
		...params.toolCallId ? { toolCallId: params.toolCallId } : {},
		...params.ctx ? { ctx: params.ctx } : {},
		signal: params.signal,
		baseParams: params.baseParams,
		overrideParams: params.result?.params
	});
}
async function resolveSkillWorkshopApprovalForFinalParams(params) {
	return await resolveBeforeToolCallApprovalOutcome({
		result: await resolveSkillWorkshopToolApproval({
			toolName: params.toolName,
			toolParams: require_plain_object.isPlainObject(params.params) ? params.params : {},
			...params.ctx?.config ? { config: params.ctx.config } : {},
			...params.ctx?.workspaceDir ? { workspaceDir: params.ctx.workspaceDir } : {}
		}),
		approvalMode: params.approvalMode,
		toolName: params.toolName,
		...params.toolCallId ? { toolCallId: params.toolCallId } : {},
		...params.ctx ? { ctx: params.ctx } : {},
		signal: params.signal,
		baseParams: params.params
	});
}
/** Build the standard terminal result for vetoed tool calls. */
function buildBlockedToolResult(params) {
	recordPreExecutionBlockedToolCall(params.toolCallId, params.runId);
	return {
		content: [{
			type: "text",
			text: params.reason
		}],
		details: {
			status: "blocked",
			deniedReason: params.deniedReason ?? "plugin-before-tool-call",
			reason: params.reason
		}
	};
}
function buildToolContentPrivateData(policy, args) {
	if (!policy.toolInputs && !policy.toolOutputs) return;
	const toolContent = {};
	if (policy.toolInputs) toolContent.toolInput = require_diagnostic_llm_content.cloneDiagnosticContentValue(args.input);
	if (args.includeOutput && policy.toolOutputs) toolContent.toolOutput = require_diagnostic_llm_content.cloneDiagnosticContentValue(args.output);
	return Object.keys(toolContent).length > 0 ? { toolContent } : void 0;
}
function summarizeToolParams(params) {
	if (params === null) return { kind: "null" };
	if (params === void 0) return { kind: "undefined" };
	if (Array.isArray(params)) return {
		kind: "array",
		length: params.length
	};
	if (typeof params === "object") return { kind: "object" };
	if (typeof params === "string") return {
		kind: "string",
		length: params.length
	};
	if (typeof params === "number") return { kind: "number" };
	if (typeof params === "boolean") return { kind: "boolean" };
	return { kind: "other" };
}
function shouldEmitLoopWarning(state, warningKey, count) {
	if (!state.toolLoopWarningBuckets) state.toolLoopWarningBuckets = /* @__PURE__ */ new Map();
	const bucket = Math.floor(count / LOOP_WARNING_BUCKET_SIZE);
	if (bucket <= (state.toolLoopWarningBuckets.get(warningKey) ?? 0)) return false;
	state.toolLoopWarningBuckets.set(warningKey, bucket);
	if (state.toolLoopWarningBuckets.size > MAX_LOOP_WARNING_KEYS) {
		const oldest = state.toolLoopWarningBuckets.keys().next().value;
		if (oldest) state.toolLoopWarningBuckets.delete(oldest);
	}
	return true;
}
async function recordLoopOutcome(args) {
	if (!args.ctx?.sessionKey && !args.ctx?.sessionId) return;
	let recordedOutcome;
	try {
		const { getDiagnosticSessionState, recordToolCallOutcome } = await loadBeforeToolCallRuntime();
		const record = recordToolCallOutcome(getDiagnosticSessionState({
			sessionKey: args.ctx.sessionKey,
			sessionId: args.ctx.sessionId
		}), {
			toolName: args.toolName,
			toolParams: args.toolParams,
			toolCallId: args.toolCallId,
			result: args.result,
			error: args.error,
			config: args.ctx.loopDetection,
			...args.ctx.runId && { runId: args.ctx.runId }
		});
		if (record?.resultHash && args.ctx.onToolOutcome) recordedOutcome = {
			toolName: record.toolName,
			argsHash: record.argsHash,
			resultHash: record.resultHash,
			...args.toolCallOrdinal !== void 0 ? { toolCallOrdinal: args.toolCallOrdinal } : {},
			...args.terminalPresentation ? { terminalPresentation: args.terminalPresentation } : {}
		};
	} catch (err) {
		log$1.warn(`tool loop outcome tracking failed: tool=${args.toolName} error=${String(err)}`);
	}
	if (recordedOutcome) args.ctx.onToolOutcome?.(recordedOutcome);
}
/** Run the full before_tool_call policy chain for a pending tool call. */
async function runBeforeToolCallHook(args) {
	const toolName = require_tool_policy.normalizeToolName(args.toolName || "tool");
	const params = args.params;
	try {
		if (args.ctx?.sessionKey) {
			const { getDiagnosticSessionState, logToolLoopAction, detectToolCallLoop, recordToolCall } = await loadBeforeToolCallRuntime();
			const sessionState = getDiagnosticSessionState({
				sessionKey: args.ctx.sessionKey,
				sessionId: args.ctx.sessionId
			});
			const loopScope = args.ctx.runId ? { runId: args.ctx.runId } : void 0;
			const loopResult = detectToolCallLoop(sessionState, toolName, params, args.ctx.loopDetection, loopScope);
			if (loopResult.stuck) {
				if (loopResult.level === "critical") {
					log$1.error(`Blocking ${toolName} due to critical loop: ${loopResult.message}`);
					logToolLoopAction({
						sessionKey: args.ctx.sessionKey,
						sessionId: args.ctx.sessionId,
						toolName,
						level: "critical",
						action: "block",
						detector: loopResult.detector,
						count: loopResult.count,
						message: loopResult.message,
						pairedToolName: loopResult.pairedToolName
					});
					return {
						blocked: true,
						kind: "veto",
						deniedReason: "tool-loop",
						reason: loopResult.message,
						params
					};
				}
				const baseWarningKey = loopResult.warningKey ?? `${loopResult.detector}:${toolName}`;
				if (shouldEmitLoopWarning(sessionState, args.ctx.runId ? `${args.ctx.runId}:${baseWarningKey}` : baseWarningKey, loopResult.count)) {
					log$1.warn(`Loop warning for ${toolName}: ${loopResult.message}`);
					logToolLoopAction({
						sessionKey: args.ctx.sessionKey,
						sessionId: args.ctx.sessionId,
						toolName,
						level: "warning",
						action: "warn",
						detector: loopResult.detector,
						count: loopResult.count,
						message: loopResult.message,
						pairedToolName: loopResult.pairedToolName
					});
				}
			}
			if (args.ctx.loopDetection?.enabled !== false) recordToolCall(sessionState, toolName, params, args.toolCallId, args.ctx.loopDetection, loopScope);
		}
		const hookRunner = require_hook_runner_global.getGlobalHookRunner();
		const hasBeforeToolCallHooks = hookRunner?.hasHooks("before_tool_call") === true;
		const policyRegistry = require_hook_runner_global.getGlobalHookRunnerRegistry() ?? void 0;
		const shouldRunTrustedPolicies = hasTrustedToolPolicies(policyRegistry);
		const normalizedParams = require_plain_object.isPlainObject(params) ? params : {};
		if (!await resolveSkillWorkshopToolApproval({
			toolName,
			toolParams: normalizedParams,
			...args.ctx?.config ? { config: args.ctx.config } : {},
			...args.ctx?.workspaceDir ? { workspaceDir: args.ctx.workspaceDir } : {}
		}) && !shouldRunTrustedPolicies && !hasBeforeToolCallHooks) return {
			blocked: false,
			params
		};
		const deriveOptions = args.ctx?.cwd || args.ctx?.sandbox ? {
			...args.ctx.cwd ? { cwd: args.ctx.cwd } : {},
			...args.ctx.sandbox ? { sandbox: args.ctx.sandbox } : {}
		} : void 0;
		const derivedToolParams = deriveToolParams(toolName, normalizedParams, deriveOptions);
		const deriveToolEventParams = (candidateParams) => {
			const derived = deriveToolParams(toolName, candidateParams, deriveOptions);
			return derived.derivedPaths ? { derivedPaths: derived.derivedPaths } : {};
		};
		const toolIdentity = {
			...args.toolKind && { toolKind: args.toolKind },
			...args.toolInputKind && { toolInputKind: args.toolInputKind }
		};
		const buildToolContext = (identity) => ({
			toolName,
			...identity,
			...args.ctx?.agentId && { agentId: args.ctx.agentId },
			...args.ctx?.sessionKey && { sessionKey: args.ctx.sessionKey },
			...args.ctx?.sessionId && { sessionId: args.ctx.sessionId },
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.ctx?.trace && { trace: require_diagnostic_events.freezeDiagnosticTraceContext(args.ctx.trace) },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...args.ctx?.channelId && { channelId: args.ctx.channelId }
		});
		const toolContext = buildToolContext(toolIdentity);
		const trustedPolicyResult = shouldRunTrustedPolicies ? await runTrustedToolPolicies({
			toolName,
			params: normalizedParams,
			...toolIdentity,
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...derivedToolParams.derivedPaths ? { derivedPaths: derivedToolParams.derivedPaths } : {}
		}, toolContext, {
			...policyRegistry ? { registry: policyRegistry } : {},
			...args.ctx?.config ? { config: args.ctx.config } : {},
			deriveEvent: deriveToolEventParams,
			normalizeEvent(eventValue) {
				const normalizedEventParams = require_code_mode_control_tools.normalizeCodeModeExecBeforeHookParamsForToolKind({
					toolKind: eventValue.toolKind,
					params: eventValue.params
				});
				if (!require_plain_object.isPlainObject(normalizedEventParams)) return;
				const normalizedEventIdentity = require_code_mode_control_tools.getCodeModeExecBeforeHookMetadataForToolKind({
					toolKind: eventValue.toolKind,
					params: normalizedEventParams
				});
				return {
					params: normalizedEventParams,
					...normalizedEventIdentity ? {
						event: normalizedEventIdentity,
						ctx: normalizedEventIdentity
					} : {}
				};
			}
		}) : void 0;
		if (trustedPolicyResult?.block) return {
			blocked: true,
			kind: "veto",
			deniedReason: "plugin-before-tool-call",
			reason: trustedPolicyResult.blockReason || "Tool call blocked by trusted plugin policy",
			params
		};
		let trustedApprovalParams;
		let trustedApprovalResolution;
		if (trustedPolicyResult?.requireApproval) {
			const approvalOutcome = await resolveBeforeToolCallApprovalOutcome({
				result: trustedPolicyResult,
				approvalMode: args.approvalMode,
				toolName,
				...args.toolCallId ? { toolCallId: args.toolCallId } : {},
				...args.ctx ? { ctx: args.ctx } : {},
				signal: args.signal,
				baseParams: params
			});
			if (approvalOutcome) {
				if (approvalOutcome.blocked) return approvalOutcome;
				if (approvalOutcome.deferredApproval) return approvalOutcome;
				trustedApprovalParams = approvalOutcome.params;
				trustedApprovalResolution = approvalOutcome.approvalResolution;
			}
		}
		const rawPolicyAdjustedParams = trustedApprovalParams ?? trustedPolicyResult?.params ?? params;
		const policyAdjustedParams = require_code_mode_control_tools.normalizeCodeModeExecBeforeHookParamsForToolKind({
			toolKind: args.toolKind,
			params: rawPolicyAdjustedParams
		});
		const policyAdjustedToolIdentity = require_code_mode_control_tools.getCodeModeExecBeforeHookMetadataForToolKind({
			toolKind: args.toolKind,
			params: policyAdjustedParams
		}) ?? toolIdentity;
		const policyAdjustedToolContext = buildToolContext(policyAdjustedToolIdentity);
		const policyAdjustedDerivedToolParams = trustedPolicyResult?.params && require_plain_object.isPlainObject(policyAdjustedParams) ? deriveToolParams(toolName, policyAdjustedParams, deriveOptions) : derivedToolParams;
		if (!hasBeforeToolCallHooks) {
			const finalApprovalOutcome = await resolveSkillWorkshopApprovalForFinalParams({
				toolName,
				params: policyAdjustedParams,
				approvalMode: args.approvalMode,
				...args.toolCallId ? { toolCallId: args.toolCallId } : {},
				...args.ctx ? { ctx: args.ctx } : {},
				signal: args.signal
			});
			if (finalApprovalOutcome) return finalApprovalOutcome;
			const allowed = {
				blocked: false,
				params: policyAdjustedParams
			};
			if (trustedApprovalResolution) allowed.approvalResolution = trustedApprovalResolution;
			return allowed;
		}
		const hookEventParams = require_plain_object.isPlainObject(policyAdjustedParams) ? policyAdjustedParams : {};
		const hookResult = await hookRunner.runBeforeToolCall({
			toolName,
			params: hookEventParams,
			...policyAdjustedToolIdentity,
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...policyAdjustedDerivedToolParams.derivedPaths ? { derivedPaths: policyAdjustedDerivedToolParams.derivedPaths } : {}
		}, policyAdjustedToolContext);
		if (hookResult?.block) return {
			blocked: true,
			kind: "veto",
			deniedReason: "plugin-before-tool-call",
			reason: hookResult.blockReason || "Tool call blocked by plugin hook",
			params: policyAdjustedParams
		};
		let finalParams = policyAdjustedParams;
		let finalApprovalResolution = trustedApprovalResolution;
		if (hookResult?.requireApproval) {
			const approvalOutcome = await resolveBeforeToolCallApprovalOutcome({
				result: hookResult,
				approvalMode: args.approvalMode,
				toolName,
				...args.toolCallId ? { toolCallId: args.toolCallId } : {},
				...args.ctx ? { ctx: args.ctx } : {},
				signal: args.signal,
				baseParams: policyAdjustedParams
			});
			if (approvalOutcome) {
				if (approvalOutcome.blocked) return approvalOutcome;
				if (approvalOutcome.deferredApproval) return approvalOutcome;
				finalParams = approvalOutcome.params;
				finalApprovalResolution = approvalOutcome.approvalResolution ?? finalApprovalResolution;
			}
		}
		if (hookResult?.params) finalParams = mergeParamsWithApprovalOverrides(finalParams, hookResult.params);
		const finalApprovalOutcome = await resolveSkillWorkshopApprovalForFinalParams({
			toolName,
			params: finalParams,
			approvalMode: args.approvalMode,
			...args.toolCallId ? { toolCallId: args.toolCallId } : {},
			...args.ctx ? { ctx: args.ctx } : {},
			signal: args.signal
		});
		if (finalApprovalOutcome) return finalApprovalOutcome;
		const allowed = {
			blocked: false,
			params: finalParams
		};
		if (finalApprovalResolution) allowed.approvalResolution = finalApprovalResolution;
		return allowed;
	} catch (err) {
		const toolCallId = args.toolCallId ? ` toolCallId=${args.toolCallId}` : "";
		const cause = unwrapErrorCause(err);
		log$1.error(`before_tool_call hook failed: tool=${toolName}${toolCallId} error=${String(cause)}`);
		return {
			blocked: true,
			kind: "failure",
			deniedReason: "plugin-before-tool-call",
			disposition: resolveToolErrorDiagnostic(cause, args.signal).terminalReason,
			reason: BEFORE_TOOL_CALL_HOOK_FAILURE_REASON,
			params
		};
	}
}
function wrapToolWithBeforeToolCallHook(tool, ctx, options = {}) {
	const execute = tool.execute;
	if (!execute) return tool;
	const toolName = tool.name || "tool";
	const diagnosticIdentity = resolveToolDiagnosticIdentity(tool);
	const hookOptions = {
		...options.approvalMode ? { approvalMode: options.approvalMode } : {},
		emitDiagnostics: options.emitDiagnostics !== false
	};
	const toolContentPolicy = require_diagnostic_llm_content.resolveDiagnosticModelContentCapturePolicy(ctx?.config);
	const wrappedTool = {
		...tool,
		execute: async (toolCallId, params, signal, onUpdate) => {
			const toolCallOrdinal = ctx?.allocateToolOutcomeOrdinal?.(toolCallId);
			const preExecutionStartedAt = Date.now();
			const normalizedToolName = require_tool_policy.normalizeToolName(toolName || "tool");
			const trace = hookOptions.emitDiagnostics && ctx?.trace ? require_diagnostic_events.freezeDiagnosticTraceContext(require_diagnostic_events.createChildDiagnosticTraceContext(ctx.trace)) : void 0;
			const buildEventBase = (toolParams) => ({
				...ctx?.runId && { runId: ctx.runId },
				...ctx?.sessionKey && { sessionKey: ctx.sessionKey },
				...ctx?.sessionId && { sessionId: ctx.sessionId },
				...ctx?.agentId && { agentId: ctx.agentId },
				...trace && { trace },
				toolName: normalizedToolName,
				...diagnosticIdentity,
				...toolCallId && { toolCallId },
				paramsSummary: summarizeToolParams(toolParams)
			});
			const recordPreExecutionError = (error, toolParams, errorCategory) => {
				recordPreExecutionBlockedToolCall(toolCallId, ctx?.runId);
				if (!hookOptions.emitDiagnostics) return;
				require_diagnostic_events.emitTrustedDiagnosticEvent({
					type: "tool.execution.error",
					...buildEventBase(toolParams),
					durationMs: Date.now() - preExecutionStartedAt,
					...resolveToolErrorDiagnostic(error, signal, errorCategory)
				});
			};
			const recordPreExecutionDisposition = (toolParams, disposition, errorCategory, deniedReason) => {
				recordPreExecutionBlockedToolCall(toolCallId, ctx?.runId);
				if (!hookOptions.emitDiagnostics) return;
				const eventBase = buildEventBase(toolParams);
				if (disposition === "blocked") {
					const reason = deniedReason ?? "plugin-before-tool-call";
					require_diagnostic_events.emitTrustedDiagnosticEvent({
						type: "tool.execution.blocked",
						...eventBase,
						deniedReason: reason,
						reason
					});
					return;
				}
				require_diagnostic_events.emitTrustedDiagnosticEvent({
					type: "tool.execution.error",
					...eventBase,
					durationMs: Date.now() - preExecutionStartedAt,
					errorCategory: disposition === "cancelled" ? "aborted" : errorCategory,
					terminalReason: disposition
				});
			};
			const prepare = tool.prepareBeforeToolCallParams;
			let preparedParams;
			try {
				preparedParams = prepare ? await prepare(params, {
					...toolCallId ? { toolCallId } : {},
					...ctx ? { hookContext: ctx } : {},
					...signal ? { signal } : {}
				}) : params;
			} catch (error) {
				recordPreExecutionError(error, params, "tool_preparation");
				throw tagBeforeToolCallFailure(error, signal);
			}
			const hookParams = require_code_mode_control_tools.normalizeCodeModeExecBeforeHookParams({
				tool,
				params: preparedParams
			});
			const hookMetadata = require_code_mode_control_tools.getCodeModeExecBeforeHookMetadata({
				tool,
				params: preparedParams
			});
			let outcome;
			try {
				outcome = await runBeforeToolCallHook({
					toolName,
					params: hookParams,
					...hookMetadata,
					toolCallId,
					ctx,
					signal,
					approvalMode: hookOptions.approvalMode
				});
			} catch (error) {
				recordPreExecutionError(error, hookParams, "before_tool_call");
				throw tagBeforeToolCallFailure(error, signal);
			}
			if (outcome.blocked) {
				if (outcome.kind !== "veto") {
					recordPreExecutionDisposition(outcome.params ?? hookParams, outcome.disposition, outcome.deniedReason === "plugin-approval" ? "plugin_approval" : "before_tool_call", outcome.deniedReason);
					throw new BeforeToolCallFailureError(outcome.reason, outcome.disposition);
				}
				const eventBase = buildEventBase(outcome.params ?? hookParams);
				if (hookOptions.emitDiagnostics) {
					require_diagnostic_events.emitTrustedDiagnosticEvent({
						type: "tool.execution.blocked",
						...eventBase,
						reason: outcome.reason,
						deniedReason: outcome.deniedReason ?? "plugin-before-tool-call"
					});
					emitToolBlockedSecurityEvent({
						ctx,
						deniedReason: outcome.deniedReason ?? "plugin-before-tool-call",
						toolIdentity: diagnosticIdentity,
						toolName: normalizedToolName,
						trace,
						paramsSummary: eventBase.paramsSummary
					});
				}
				const blockedResult = buildBlockedToolResult({
					reason: outcome.reason,
					deniedReason: outcome.deniedReason ?? "plugin-before-tool-call",
					toolCallId,
					runId: ctx?.runId
				});
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: outcome.params ?? hookParams,
					toolCallId,
					result: blockedResult,
					toolCallOrdinal
				});
				return blockedResult;
			}
			let executeParams;
			try {
				signal?.throwIfAborted();
				executeParams = require_code_mode_control_tools.reconcileCodeModeExecBeforeHookParams({
					tool,
					originalParams: preparedParams,
					hookParams,
					adjustedParams: outcome.params
				});
				executeParams = tool.finalizeBeforeToolCallParams?.(executeParams, preparedParams) ?? executeParams;
			} catch (error) {
				recordPreExecutionError(error, outcome.params ?? hookParams, "tool_preparation");
				throw tagBeforeToolCallFailure(error, signal);
			}
			recordAdjustedParamsForToolCall(toolCallId, executeParams, ctx?.runId);
			const eventBase = buildEventBase(executeParams);
			recordToolExecutionStarted(toolCallId, ctx?.runId);
			if (hookOptions.emitDiagnostics) require_diagnostic_events.emitTrustedDiagnosticEvent({
				type: "tool.execution.started",
				...eventBase
			});
			const startedAt = Date.now();
			try {
				const result = await execute(toolCallId, executeParams, signal, onUpdate);
				const durationMs = Date.now() - startedAt;
				const terminalPresentation = resolveToolTerminalPresentation({
					tool,
					toolParams: executeParams,
					result
				});
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: executeParams,
					toolCallId,
					result,
					toolCallOrdinal,
					terminalPresentation
				});
				rememberPendingTerminalPresentation({
					ctx,
					tool,
					toolParams: executeParams,
					toolCallId,
					toolCallOrdinal
				});
				const skillMatch = findSkillUsageMatch({
					toolName: normalizedToolName,
					toolParams: executeParams,
					ctx
				});
				if (hookOptions.emitDiagnostics) {
					if (skillMatch) emitSkillUsedDiagnostic({
						ctx,
						match: skillMatch,
						toolName: normalizedToolName,
						toolCallId
					});
					const terminalEvent = resolveToolResultTerminalDiagnostic(result, durationMs);
					require_diagnostic_events.emitTrustedDiagnosticEventWithPrivateData({
						...eventBase,
						...terminalEvent
					}, buildToolContentPrivateData(toolContentPolicy, {
						input: executeParams,
						output: result,
						includeOutput: true
					}));
				}
				return result;
			} catch (err) {
				if (hookOptions.emitDiagnostics) require_diagnostic_events.emitTrustedDiagnosticEventWithPrivateData({
					type: "tool.execution.error",
					...eventBase,
					durationMs: Date.now() - startedAt,
					...resolveToolErrorDiagnostic(err, signal)
				}, buildToolContentPrivateData(toolContentPolicy, {
					input: executeParams,
					includeOutput: false
				}));
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: executeParams,
					toolCallId,
					error: err,
					toolCallOrdinal
				});
				throw err;
			}
		}
	};
	const executeWithHooks = wrappedTool.execute;
	wrappedTool.execute = async (toolCallId, params, signal, onUpdate) => {
		recordToolExecutionTracked(toolCallId, ctx?.runId);
		try {
			return await executeWithHooks(toolCallId, params, signal, onUpdate);
		} finally {
			clearTrackedToolExecution(toolCallId, ctx?.runId);
		}
	};
	require_tools.copyPluginToolMeta(tool, wrappedTool);
	require_gateway.copyChannelAgentToolMeta(tool, wrappedTool);
	require_gateway.copyToolTerminalPresentation(tool, wrappedTool);
	Object.defineProperty(wrappedTool, require_gateway.BEFORE_TOOL_CALL_WRAPPED, {
		value: true,
		enumerable: true
	});
	Object.defineProperty(wrappedTool, require_gateway.BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS, {
		value: hookOptions,
		enumerable: false
	});
	Object.defineProperty(wrappedTool, require_gateway.BEFORE_TOOL_CALL_SOURCE_TOOL, {
		value: tool,
		enumerable: false
	});
	Object.defineProperty(wrappedTool, require_gateway.BEFORE_TOOL_CALL_HOOK_CONTEXT, {
		value: ctx,
		enumerable: false
	});
	return wrappedTool;
}
/** Rebuild a before_tool_call wrapper while preserving the original source tool. */
function rewrapToolWithBeforeToolCallHook(tool, ctx, options = {}) {
	const taggedTool = tool;
	const source = taggedTool[require_gateway.BEFORE_TOOL_CALL_SOURCE_TOOL];
	const wrappedContext = taggedTool[require_gateway.BEFORE_TOOL_CALL_HOOK_CONTEXT];
	const preservedContext = wrappedContext && typeof wrappedContext === "object" ? wrappedContext : void 0;
	const sourceTool = source && typeof source === "object" ? source : tool;
	if (sourceTool === tool) return wrapToolWithBeforeToolCallHook(tool, ctx ?? preservedContext, options);
	const rewrapSource = {
		...tool,
		execute: sourceTool.execute
	};
	delete rewrapSource[require_gateway.BEFORE_TOOL_CALL_WRAPPED];
	require_tools.copyPluginToolMeta(tool, rewrapSource);
	require_gateway.copyChannelAgentToolMeta(tool, rewrapSource);
	require_gateway.copyToolTerminalPresentation(tool, rewrapSource);
	return wrapToolWithBeforeToolCallHook(rewrapSource, ctx ?? preservedContext, options);
}
function recordPreExecutionBlockedToolCall(toolCallId, runId) {
	if (!toolCallId) return;
	preExecutionBlockedToolCallIds.add(buildAdjustedParamsKey({
		runId,
		toolCallId
	}));
	while (preExecutionBlockedToolCallIds.size > MAX_TRACKED_ADJUSTED_PARAMS) {
		const oldest = preExecutionBlockedToolCallIds.values().next().value;
		if (!oldest) break;
		preExecutionBlockedToolCallIds.delete(oldest);
	}
}
function toLintErrorObject(value, fallbackMessage) {
	if (value instanceof Error) return value;
	if (typeof value === "string") return new Error(value, { cause: value });
	const error = new Error(fallbackMessage, { cause: value });
	if (typeof value === "object" && value !== null || typeof value === "function") Object.assign(error, value);
	return error;
}
//#endregion
//#region src/agents/harness/hook-helpers.ts
/**
* Agent harness tool/message hook helpers.
*
* Harnesses use this to dispatch after-tool-call and before-message-write hooks
* while isolating hook failures from the runtime path.
*/
const log = require_subsystem.createSubsystemLogger("agents/harness");
/** Runs best-effort after-tool-call hooks for a completed tool invocation. */
async function runAgentHarnessAfterToolCallHook(params) {
	const adjustedArgs = consumeAdjustedParamsForToolCall(params.toolCallId, params.runId);
	const resolvedArgs = adjustedArgs && typeof adjustedArgs === "object" ? adjustedArgs : params.startArgs;
	const eventArgs = structuredClone(resolvedArgs);
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("after_tool_call")) return;
	try {
		await hookRunner.runAfterToolCall({
			toolName: params.toolName,
			params: eventArgs,
			...params.runId ? { runId: params.runId } : {},
			toolCallId: params.toolCallId,
			...params.result ? { result: params.result } : {},
			...params.error ? { error: params.error } : {},
			...params.startedAt != null ? { durationMs: Date.now() - params.startedAt } : {}
		}, {
			toolName: params.toolName,
			...params.agentId ? { agentId: params.agentId } : {},
			...params.sessionId ? { sessionId: params.sessionId } : {},
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			...params.runId ? { runId: params.runId } : {},
			...params.channelId ? { channelId: params.channelId } : {},
			toolCallId: params.toolCallId
		});
	} catch (error) {
		log.warn(`after_tool_call hook failed: tool=${params.toolName} error=${String(error)}`);
	}
}
/** Runs before-message-write hooks and returns the possibly rewritten message. */
function runAgentHarnessBeforeMessageWriteHook(params) {
	const hookRunner = require_hook_runner_global.getGlobalHookRunner();
	if (!hookRunner?.hasHooks("before_message_write")) return params.message;
	const result = hookRunner.runBeforeMessageWrite({ message: params.message }, {
		...params.agentId ? { agentId: params.agentId } : {},
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
	if (result?.block) return null;
	return result?.message ?? params.message;
}
//#endregion
Object.defineProperty(exports, "EmbeddedPluginApprovalBroker", {
	enumerable: true,
	get: function() {
		return EmbeddedPluginApprovalBroker;
	}
});
Object.defineProperty(exports, "PluginApprovalResolutions", {
	enumerable: true,
	get: function() {
		return PluginApprovalResolutions;
	}
});
Object.defineProperty(exports, "buildBlockedToolResult", {
	enumerable: true,
	get: function() {
		return buildBlockedToolResult;
	}
});
Object.defineProperty(exports, "cancelDeferredPluginToolApproval", {
	enumerable: true,
	get: function() {
		return cancelDeferredPluginToolApproval;
	}
});
Object.defineProperty(exports, "clearEmbeddedPluginApprovalBroker", {
	enumerable: true,
	get: function() {
		return clearEmbeddedPluginApprovalBroker;
	}
});
Object.defineProperty(exports, "consumeAdjustedParamsForToolCall", {
	enumerable: true,
	get: function() {
		return consumeAdjustedParamsForToolCall;
	}
});
Object.defineProperty(exports, "consumePreExecutionBlockedToolCall", {
	enumerable: true,
	get: function() {
		return consumePreExecutionBlockedToolCall;
	}
});
Object.defineProperty(exports, "consumeStructuredReplaySafeToolCall", {
	enumerable: true,
	get: function() {
		return consumeStructuredReplaySafeToolCall;
	}
});
Object.defineProperty(exports, "consumeTrackedToolExecutionStarted", {
	enumerable: true,
	get: function() {
		return consumeTrackedToolExecutionStarted;
	}
});
Object.defineProperty(exports, "finalizeToolTerminalPresentation", {
	enumerable: true,
	get: function() {
		return finalizeToolTerminalPresentation;
	}
});
Object.defineProperty(exports, "isBeforeToolCallBlockedError", {
	enumerable: true,
	get: function() {
		return isBeforeToolCallBlockedError;
	}
});
Object.defineProperty(exports, "isEmbeddedMode", {
	enumerable: true,
	get: function() {
		return isEmbeddedMode;
	}
});
Object.defineProperty(exports, "peekAdjustedParamsForToolCall", {
	enumerable: true,
	get: function() {
		return peekAdjustedParamsForToolCall;
	}
});
Object.defineProperty(exports, "peekPreExecutionBlockedToolCall", {
	enumerable: true,
	get: function() {
		return peekPreExecutionBlockedToolCall;
	}
});
Object.defineProperty(exports, "recordAdjustedParamsForToolCall", {
	enumerable: true,
	get: function() {
		return recordAdjustedParamsForToolCall;
	}
});
Object.defineProperty(exports, "recordStructuredReplayTrustForToolCall", {
	enumerable: true,
	get: function() {
		return recordStructuredReplayTrustForToolCall;
	}
});
Object.defineProperty(exports, "rewrapToolWithBeforeToolCallHook", {
	enumerable: true,
	get: function() {
		return rewrapToolWithBeforeToolCallHook;
	}
});
Object.defineProperty(exports, "runAgentHarnessAfterToolCallHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessAfterToolCallHook;
	}
});
Object.defineProperty(exports, "runAgentHarnessBeforeMessageWriteHook", {
	enumerable: true,
	get: function() {
		return runAgentHarnessBeforeMessageWriteHook;
	}
});
Object.defineProperty(exports, "runBeforeToolCallHook", {
	enumerable: true,
	get: function() {
		return runBeforeToolCallHook;
	}
});
Object.defineProperty(exports, "setEmbeddedMode", {
	enumerable: true,
	get: function() {
		return setEmbeddedMode;
	}
});
Object.defineProperty(exports, "setEmbeddedPluginApprovalBroker", {
	enumerable: true,
	get: function() {
		return setEmbeddedPluginApprovalBroker;
	}
});
Object.defineProperty(exports, "wrapToolWithBeforeToolCallHook", {
	enumerable: true,
	get: function() {
		return wrapToolWithBeforeToolCallHook;
	}
});
