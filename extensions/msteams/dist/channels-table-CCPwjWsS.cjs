const require_token_format = require("./token-format-CytezBZb.cjs");
const require_format_duration = require("./format-duration-BV8edXFT.cjs");
const require_runtime_status = require("./runtime-status-C-qXaf3z.cjs");
const require_service_runtime = require("./service-runtime-BkEjx9FW.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/commands/status.format.ts
const formatKTokens = require_token_format.formatTokenCount;
/** Formats a duration or returns `unknown` for missing/non-finite values. */
const formatDuration = (ms) => {
	if (ms == null || !Number.isFinite(ms)) return "unknown";
	return require_format_duration.formatDurationPrecise(ms, { decimals: 1 });
};
/** Formats session token usage and prompt-cache hit rate for the sessions table. */
const formatTokensCompact = (sess) => {
	const used = sess.totalTokens;
	const ctx = sess.contextTokens;
	let result;
	if (used == null) result = ctx ? `unknown/${formatKTokens(ctx)} (?%)` : "unknown used";
	else if (!ctx) result = `${formatKTokens(used)} used`;
	else {
		const pctLabel = sess.percentUsed != null ? `${sess.percentUsed}%` : "?%";
		result = `${formatKTokens(used)}/${formatKTokens(ctx)} (${pctLabel})`;
	}
	const cacheStats = resolvePromptCacheStats(sess);
	if (cacheStats && cacheStats.cacheRead > 0) result += ` · 🗄️ ${cacheStats.hitRate}% cached`;
	return result;
};
/** Formats prompt-cache details for verbose sessions table output. */
const formatPromptCacheCompact = (sess) => {
	const cacheStats = resolvePromptCacheStats(sess);
	if (!cacheStats) return "";
	const parts = [`${cacheStats.hitRate}% hit`];
	if (cacheStats.cacheRead > 0) parts.push(`read ${formatKTokens(cacheStats.cacheRead)}`);
	if (cacheStats.cacheWrite > 0) parts.push(`write ${formatKTokens(cacheStats.cacheWrite)}`);
	return parts.join(" · ");
};
function resolvePromptCacheStats(sess) {
	const cacheRead = typeof sess.cacheRead === "number" && Number.isFinite(sess.cacheRead) && sess.cacheRead >= 0 ? sess.cacheRead : 0;
	const cacheWrite = typeof sess.cacheWrite === "number" && Number.isFinite(sess.cacheWrite) && sess.cacheWrite >= 0 ? sess.cacheWrite : 0;
	if (cacheRead <= 0 && cacheWrite <= 0) return null;
	const inputTokens = typeof sess.inputTokens === "number" && Number.isFinite(sess.inputTokens) && sess.inputTokens >= 0 ? sess.inputTokens : void 0;
	const promptTokensFromParts = inputTokens != null ? inputTokens + cacheRead + cacheWrite : void 0;
	const used = sess.totalTokens;
	const total = promptTokensFromParts ?? (typeof used === "number" && Number.isFinite(used) && used > 0 ? Math.max(used, cacheRead + cacheWrite) : cacheRead + cacheWrite);
	return {
		cacheRead,
		cacheWrite,
		hitRate: total > 0 ? Math.round(cacheRead / total * 100) : 0
	};
}
/** Formats daemon runtime status plus launchd/systemd details into one compact string. */
const formatDaemonRuntimeShort = (runtime) => {
	if (!runtime) return null;
	const details = [];
	const detail = runtime.detail?.replace(/\s+/g, " ").trim() || "";
	const noisyLaunchctlDetail = runtime.missingUnit === true && (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(detail).includes("could not find service");
	if (detail && !noisyLaunchctlDetail) details.push(detail);
	const cgroupSummary = require_service_runtime.getSystemdCgroupHygieneSummary(runtime.systemd);
	if (cgroupSummary) details.push(cgroupSummary);
	return require_runtime_status.formatRuntimeStatusWithDetails({
		status: runtime.status,
		pid: runtime.pid,
		state: runtime.state,
		details
	});
};
//#endregion
//#region src/commands/status-all/channel-issues.ts
/** Groups issue-like rows by channel id while preserving the original issue order per channel. */
function groupChannelIssuesByChannel(issues) {
	const byChannel = /* @__PURE__ */ new Map();
	for (const issue of issues) {
		const key = issue.channel;
		const list = byChannel.get(key);
		if (list) list.push(issue);
		else byChannel.set(key, [issue]);
	}
	return byChannel;
}
//#endregion
//#region src/commands/status-all/channels-table.ts
const statusChannelsTableColumns = [
	{
		key: "Channel",
		header: "Channel",
		minWidth: 10
	},
	{
		key: "Enabled",
		header: "Enabled",
		minWidth: 7
	},
	{
		key: "State",
		header: "State",
		minWidth: 8
	},
	{
		key: "Detail",
		header: "Detail",
		flex: true,
		minWidth: 24
	}
];
/** Formats channel rows and overlays live gateway issues onto their display state. */
function buildStatusChannelsTableRows(params) {
	const channelIssuesByChannel = groupChannelIssuesByChannel(params.channelIssues);
	const formatIssueMessage = params.formatIssueMessage ?? ((message) => message);
	return params.rows.map((row) => {
		const issues = channelIssuesByChannel.get(row.id) ?? [];
		const effectiveState = row.state === "off" ? "off" : issues.length > 0 ? "warn" : row.state;
		const issueSuffix = issues.length > 0 ? ` · ${params.warn(`gateway: ${formatIssueMessage(issues[0]?.message ?? "issue")}`)}` : "";
		return {
			Channel: row.label,
			Enabled: row.enabled ? params.ok("ON") : params.muted("OFF"),
			State: effectiveState === "ok" ? params.ok("OK") : effectiveState === "warn" ? params.warn("WARN") : effectiveState === "off" ? params.muted("OFF") : params.accentDim("SETUP"),
			Detail: `${row.detail}${issueSuffix}`
		};
	});
}
//#endregion
Object.defineProperty(exports, "buildStatusChannelsTableRows", {
	enumerable: true,
	get: function() {
		return buildStatusChannelsTableRows;
	}
});
Object.defineProperty(exports, "formatDaemonRuntimeShort", {
	enumerable: true,
	get: function() {
		return formatDaemonRuntimeShort;
	}
});
Object.defineProperty(exports, "formatDuration", {
	enumerable: true,
	get: function() {
		return formatDuration;
	}
});
Object.defineProperty(exports, "formatKTokens", {
	enumerable: true,
	get: function() {
		return formatKTokens;
	}
});
Object.defineProperty(exports, "formatPromptCacheCompact", {
	enumerable: true,
	get: function() {
		return formatPromptCacheCompact;
	}
});
Object.defineProperty(exports, "formatTokensCompact", {
	enumerable: true,
	get: function() {
		return formatTokensCompact;
	}
});
Object.defineProperty(exports, "groupChannelIssuesByChannel", {
	enumerable: true,
	get: function() {
		return groupChannelIssuesByChannel;
	}
});
Object.defineProperty(exports, "statusChannelsTableColumns", {
	enumerable: true,
	get: function() {
		return statusChannelsTableColumns;
	}
});
