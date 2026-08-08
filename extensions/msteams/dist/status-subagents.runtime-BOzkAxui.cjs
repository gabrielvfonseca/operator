require("./rolldown-runtime-u92d-OFm.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_subagent_registry = require("./subagent-registry-DLykI6PJ.cjs");
const require_subagents_utils = require("./subagents-utils-DU8qD7dC.cjs");
const require_subagent_control = require("./subagent-control-qMe-_eoQ.cjs");
//#region src/auto-reply/reply/commands-status-subagents.ts
function formatActiveSubagentDetail(params) {
	const { entry, now, pendingDescendants } = params;
	const startedAt = entry.startedAt ?? entry.sessionStartedAt ?? entry.createdAt;
	const duration = require_format_duration.formatDurationCompact(Math.max(0, (entry.endedAt && pendingDescendants === 0 ? entry.endedAt : now) - startedAt), { spaced: true }) ?? "0s";
	return `  • ${require_subagents_utils.formatRunLabel(entry, { maxLength: 56 })} · ${duration}${pendingDescendants > 0 ? ` · ${pendingDescendants} child${pendingDescendants === 1 ? "" : "ren"} active` : ""}`;
}
/** Builds the compact status line for active and completed subagents. */
function buildSubagentsStatusLine(params) {
	const { runs, pendingDescendantsForRun, verboseEnabled } = params;
	if (runs.length === 0) return;
	const activeWithDescendants = runs.map((entry) => ({
		entry,
		pendingDescendants: pendingDescendantsForRun(entry)
	})).filter(({ entry, pendingDescendants }) => !entry.endedAt || pendingDescendants > 0);
	const active = activeWithDescendants.map(({ entry }) => entry);
	const done = runs.length - active.length;
	if (active.length === 0) return verboseEnabled && done > 0 ? `🤖 Subagents: 0 active · ${done} done` : void 0;
	const summary = `🤖 Subagents: ${active.length} active${done > 0 ? ` · ${done} done` : ""}`;
	const now = params.now ?? Date.now();
	const detailLookup = new Map(activeWithDescendants.map(({ entry, pendingDescendants }) => [entry.runId, pendingDescendants]));
	return [summary, ...require_subagents_utils.sortSubagentRuns(active).slice(0, 3).map((entry) => formatActiveSubagentDetail({
		entry,
		now,
		pendingDescendants: detailLookup.get(entry.runId) ?? 0
	}))].join("\n");
}
//#endregion
exports.buildSubagentsStatusLine = buildSubagentsStatusLine;
exports.countPendingDescendantRuns = require_subagent_registry.countPendingDescendantRuns;
exports.listControlledSubagentRuns = require_subagent_control.listControlledSubagentRuns;
