require("./utils-CXqBhRFw.cjs");
const require_task_status = require("./task-status-CjWQHsl4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/auto-reply/reply/subagents-utils.ts
function resolveSubagentLabel(entry, fallback = "subagent") {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.label) || (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.task) || fallback;
}
function formatRunLabel(entry, options) {
	const raw = require_task_status.sanitizeTaskStatusText(resolveSubagentLabel(entry)) || "subagent";
	const maxLength = options?.maxLength ?? 72;
	if (!Number.isFinite(maxLength) || maxLength <= 0) return raw;
	return raw.length > maxLength ? `${(0, _gabrielvfonseca_normalization_core_utf16_slice.truncateUtf16Safe)(raw, maxLength).trimEnd()}…` : raw;
}
function formatRunStatus(entry) {
	if (!entry.endedAt) return "running";
	const status = entry.outcome?.status ?? "done";
	return status === "ok" ? "done" : status;
}
function sortSubagentRuns(runs) {
	return [...runs].toSorted((a, b) => {
		const aTime = a.startedAt ?? a.createdAt ?? 0;
		return (b.startedAt ?? b.createdAt ?? 0) - aTime;
	});
}
function resolveSubagentTargetFromRuns(params) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.token);
	if (!trimmed) return { error: params.errors.missingTarget };
	const sorted = sortSubagentRuns(params.runs);
	const deduped = [];
	const seenChildSessionKeys = /* @__PURE__ */ new Set();
	for (const entry of sorted) {
		if (seenChildSessionKeys.has(entry.childSessionKey)) continue;
		seenChildSessionKeys.add(entry.childSessionKey);
		deduped.push(entry);
	}
	if (trimmed === "last") return { entry: deduped[0] };
	const isActive = params.isActive ?? ((entry) => !entry.endedAt);
	const recentCutoff = Date.now() - params.recentWindowMinutes * 6e4;
	const numericOrder = [...deduped.filter((entry) => isActive(entry)), ...deduped.filter((entry) => !isActive(entry) && Boolean(entry.endedAt) && (entry.endedAt ?? 0) >= recentCutoff)];
	if (/^\d+$/.test(trimmed)) {
		const idx = Number.parseInt(trimmed, 10);
		if (!Number.isFinite(idx) || idx <= 0 || idx > numericOrder.length) return { error: params.errors.invalidIndex(trimmed) };
		return { entry: numericOrder[idx - 1] };
	}
	if (trimmed.includes(":")) {
		const bySessionKey = deduped.find((entry) => entry.childSessionKey === trimmed);
		return bySessionKey ? { entry: bySessionKey } : { error: params.errors.unknownSession(trimmed) };
	}
	const lowered = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(trimmed);
	const aliases = params.aliases ?? (() => []);
	const byExactAlias = numericOrder.filter((entry) => aliases(entry).some((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias) === lowered));
	if (byExactAlias.length === 1) return { entry: byExactAlias[0] };
	if (byExactAlias.length > 1) return { error: params.errors.ambiguousLabel(trimmed) };
	const byExactLabel = deduped.filter((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.label(entry)) === lowered);
	if (byExactLabel.length === 1) return { entry: byExactLabel[0] };
	if (byExactLabel.length > 1) return { error: params.errors.ambiguousLabel(trimmed) };
	const byAliasPrefix = numericOrder.filter((entry) => aliases(entry).some((alias) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(alias).startsWith(lowered)));
	if (byAliasPrefix.length === 1) return { entry: byAliasPrefix[0] };
	if (byAliasPrefix.length > 1) return { error: params.errors.ambiguousLabelPrefix(trimmed) };
	const byLabelPrefix = deduped.filter((entry) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.label(entry)).startsWith(lowered));
	if (byLabelPrefix.length === 1) return { entry: byLabelPrefix[0] };
	if (byLabelPrefix.length > 1) return { error: params.errors.ambiguousLabelPrefix(trimmed) };
	const byRunIdPrefix = deduped.filter((entry) => entry.runId.startsWith(trimmed));
	if (byRunIdPrefix.length === 1) return { entry: byRunIdPrefix[0] };
	if (byRunIdPrefix.length > 1) return { error: params.errors.ambiguousRunIdPrefix(trimmed) };
	return { error: params.errors.unknownTarget(trimmed) };
}
//#endregion
Object.defineProperty(exports, "formatRunLabel", {
	enumerable: true,
	get: function() {
		return formatRunLabel;
	}
});
Object.defineProperty(exports, "formatRunStatus", {
	enumerable: true,
	get: function() {
		return formatRunStatus;
	}
});
Object.defineProperty(exports, "resolveSubagentLabel", {
	enumerable: true,
	get: function() {
		return resolveSubagentLabel;
	}
});
Object.defineProperty(exports, "resolveSubagentTargetFromRuns", {
	enumerable: true,
	get: function() {
		return resolveSubagentTargetFromRuns;
	}
});
Object.defineProperty(exports, "sortSubagentRuns", {
	enumerable: true,
	get: function() {
		return sortSubagentRuns;
	}
});
