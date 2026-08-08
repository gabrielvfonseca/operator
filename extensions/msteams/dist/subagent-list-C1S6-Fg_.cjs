const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_subagent_registry_state = require("./subagent-registry-state-Cb8uurME.cjs");
const require_subagent_run_generation = require("./subagent-run-generation-Ds6deSIQ.cjs");
const require_subagent_run_liveness = require("./subagent-run-liveness-DmyqOa7r.cjs");
require("./subagent-registry-read-LeoF2Gsl.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
const require_subagents_format = require("./subagents-format-CR10Nst3.cjs");
const require_model_selection_display = require("./model-selection-display-C-10ICLf.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/subagent-list.ts
/**
* Subagent list builder.
*
* Combines live registry runs and persisted session metadata for sessions_list/subagents views.
*/
function resolveStorePathForKey(cfg, parsed) {
	return require_paths.resolveStorePath(cfg.session?.store, { agentId: parsed?.agentId });
}
/** Resolve persisted session metadata for a session key, caching per store path. */
function resolveSessionEntryForKey(params) {
	const parsed = require_session_key.parseAgentSessionKey(params.key);
	const storePath = resolveStorePathForKey(params.cfg, parsed);
	let store = params.cache.get(storePath);
	if (!store) {
		store = Object.fromEntries(require_session_accessor.listSessionEntries({
			storePath,
			clone: false
		}).map(({ sessionKey, entry }) => [sessionKey, entry]));
		params.cache.set(storePath, store);
	}
	return {
		storePath,
		entry: store[params.key]
	};
}
/** Build child-session indexes from the latest run associated with each child key. */
function buildLatestSubagentRunIndex(runs, options) {
	const now = options?.now ?? Date.now();
	const latestByChildSessionKey = /* @__PURE__ */ new Map();
	for (const entry of runs.values()) {
		const childSessionKey = entry.childSessionKey?.trim();
		if (!childSessionKey) continue;
		const existing = latestByChildSessionKey.get(childSessionKey);
		if (!existing || require_subagent_run_generation.compareSubagentRunGeneration(entry, existing) > 0) latestByChildSessionKey.set(childSessionKey, entry);
	}
	const childSessionsByController = /* @__PURE__ */ new Map();
	for (const [childSessionKey, entry] of latestByChildSessionKey.entries()) {
		const controllerSessionKey = entry.controllerSessionKey?.trim() || entry.requesterSessionKey?.trim();
		if (!controllerSessionKey) continue;
		if (!require_subagent_run_liveness.shouldKeepSubagentRunChildLink(entry, {
			activeDescendants: require_subagent_registry_state.countActiveDescendantRunsFromRuns(runs, childSessionKey),
			now
		})) continue;
		const existing = childSessionsByController.get(controllerSessionKey);
		if (existing) {
			existing.push(childSessionKey);
			continue;
		}
		childSessionsByController.set(controllerSessionKey, [childSessionKey]);
	}
	for (const [controllerSessionKey, childSessions] of childSessionsByController) childSessionsByController.set(controllerSessionKey, childSessions.toSorted());
	return {
		latestByChildSessionKey,
		childSessionsByController
	};
}
/** Create a cached descendant counter for repeated list rendering checks. */
function createPendingDescendantCounter(runsSnapshot) {
	const pendingDescendantCache = /* @__PURE__ */ new Map();
	return (sessionKey) => {
		if (pendingDescendantCache.has(sessionKey)) return pendingDescendantCache.get(sessionKey) ?? 0;
		const snapshot = runsSnapshot ?? require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns);
		const pending = Math.max(0, require_subagent_registry_state.countPendingDescendantRunsFromRuns(snapshot, sessionKey));
		pendingDescendantCache.set(sessionKey, pending);
		return pending;
	};
}
/** Return whether a run should be shown in the active subagent section. */
function isActiveSubagentRun(entry, pendingDescendantCount) {
	return require_subagent_run_liveness.isLiveUnendedSubagentRun(entry) || pendingDescendantCount(entry.childSessionKey) > 0;
}
function resolveRunStatus(entry, options) {
	const pendingDescendants = Math.max(0, options?.pendingDescendants ?? 0);
	if (pendingDescendants > 0) return `active (waiting on ${pendingDescendants} ${pendingDescendants === 1 ? "child" : "children"})`;
	if (!require_subagent_run_liveness.hasSubagentRunEnded(entry)) return "running";
	const status = entry.outcome?.status ?? "done";
	if (status === "ok") return "done";
	if (status === "error") return "failed";
	return status;
}
function resolveModelRef(entry, fallbackModel) {
	return require_model_selection_display.resolveModelDisplayRef({
		runtimeProvider: entry?.modelProvider,
		runtimeModel: entry?.model,
		overrideProvider: entry?.providerOverride,
		overrideModel: entry?.modelOverride,
		fallbackModel
	});
}
function resolveModelDisplay(entry, fallbackModel) {
	return require_model_selection_display.resolveModelDisplayName({
		runtimeProvider: entry?.modelProvider,
		runtimeModel: entry?.model,
		overrideProvider: entry?.providerOverride,
		overrideModel: entry?.modelOverride,
		fallbackModel
	});
}
function buildListText(params) {
	const lines = [];
	lines.push("active subagents:");
	if (params.active.length === 0) lines.push("(none)");
	else lines.push(...params.active.map((entry) => entry.line));
	lines.push("");
	lines.push(`recent (last ${params.recentMinutes}m):`);
	if (params.recent.length === 0) lines.push("(none)");
	else lines.push(...params.recent.map((entry) => entry.line));
	return lines.join("\n");
}
/** Build structured and text views for active and recent subagent runs. */
function buildSubagentList(params) {
	const now = Date.now();
	const recentCutoff = now - params.recentMinutes * 6e4;
	const dedupedRuns = [];
	const seenChildSessionKeys = /* @__PURE__ */ new Set();
	for (const entry of require_subagents_utils.sortSubagentRuns(params.runs)) {
		if (seenChildSessionKeys.has(entry.childSessionKey)) continue;
		seenChildSessionKeys.add(entry.childSessionKey);
		dedupedRuns.push(entry);
	}
	const cache = /* @__PURE__ */ new Map();
	const snapshot = require_subagent_registry_state.getSubagentRunsSnapshotForRead(require_subagent_registry_state.subagentRuns);
	const { childSessionsByController } = buildLatestSubagentRunIndex(snapshot);
	const pendingDescendantCount = createPendingDescendantCounter(snapshot);
	let index = 1;
	const buildListEntry = (entry, runtimeMs) => {
		const sessionEntry = resolveSessionEntryForKey({
			cfg: params.cfg,
			key: entry.childSessionKey,
			cache
		}).entry;
		const totalTokens = require_subagents_format.resolveTotalTokens(sessionEntry);
		const usageText = require_subagents_format.formatTokenUsageDisplay(sessionEntry);
		const pendingDescendants = pendingDescendantCount(entry.childSessionKey);
		const status = resolveRunStatus(entry, { pendingDescendants });
		const childSessions = childSessionsByController.get(entry.childSessionKey) ?? [];
		const runtime = require_format_duration.formatDurationCompact(runtimeMs) ?? "n/a";
		const label = require_subagents_format.truncateLine(require_subagents_utils.resolveSubagentLabel(entry), 48);
		const task = require_subagents_format.truncateLine(entry.task.trim(), params.taskMaxChars ?? 72);
		const taskName = entry.taskName?.trim();
		const taskNamePrefix = taskName ? `${taskName}: ` : "";
		const line = `${index}. ${taskNamePrefix}${label} (${resolveModelDisplay(sessionEntry, entry.model)}, ${runtime}${usageText ? `, ${usageText}` : ""}) ${status}${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(task) !== (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(label) ? ` - ${task}` : ""}`;
		const view = {
			index,
			line,
			runId: entry.runId,
			sessionKey: entry.childSessionKey,
			...taskName ? { taskName } : {},
			label,
			task,
			status,
			pendingDescendants,
			runtime,
			runtimeMs,
			...childSessions.length > 0 ? { childSessions } : {},
			model: resolveModelRef(sessionEntry, entry.model),
			totalTokens,
			startedAt: require_subagent_run_liveness.getSubagentSessionStartedAt(entry),
			...entry.endedAt ? { endedAt: entry.endedAt } : {}
		};
		index += 1;
		return view;
	};
	const active = dedupedRuns.filter((entry) => isActiveSubagentRun(entry, pendingDescendantCount)).map((entry) => buildListEntry(entry, require_subagent_run_liveness.getSubagentSessionRuntimeMs(entry, now) ?? 0));
	const recent = dedupedRuns.filter((entry) => !isActiveSubagentRun(entry, pendingDescendantCount) && Boolean(entry.endedAt) && (entry.endedAt ?? 0) >= recentCutoff).map((entry) => buildListEntry(entry, require_subagent_run_liveness.getSubagentSessionRuntimeMs(entry, entry.endedAt ?? now) ?? 0));
	return {
		total: dedupedRuns.length,
		active,
		recent,
		text: buildListText({
			active,
			recent,
			recentMinutes: params.recentMinutes
		})
	};
}
//#endregion
Object.defineProperty(exports, "buildLatestSubagentRunIndex", {
	enumerable: true,
	get: function() {
		return buildLatestSubagentRunIndex;
	}
});
Object.defineProperty(exports, "buildSubagentList", {
	enumerable: true,
	get: function() {
		return buildSubagentList;
	}
});
Object.defineProperty(exports, "resolveSessionEntryForKey", {
	enumerable: true,
	get: function() {
		return resolveSessionEntryForKey;
	}
});
