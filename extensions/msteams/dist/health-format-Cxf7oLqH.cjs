const require_safe_text = require("./safe-text-BAHCZAPT.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_call = require("./call-CphTnsHC.cjs");
const require_status_state = require("./status-state-DlR_h-bu.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/health-format.ts
/** Formatting helpers for `openclaw health` failures and channel summaries. */
function formatGatewayClosedDiagnostic(err) {
	if (!require_call.isGatewayTransportError(err) || err.kind !== "closed") return;
	return `Gateway connect failed: ${require_safe_text.sanitizeTerminalText(err.message.split("\n", 1)[0] ?? "")}`;
}
const formatKv = (line, rich) => {
	const idx = line.indexOf(": ");
	if (idx <= 0) return require_theme.colorize(rich, require_theme.theme.muted, line);
	const key = line.slice(0, idx);
	const value = line.slice(idx + 2);
	const valueColor = key === "Gateway target" || key === "Config" ? require_theme.theme.command : key === "Source" ? require_theme.theme.muted : require_theme.theme.info;
	return `${require_theme.colorize(rich, require_theme.theme.muted, `${key}:`)} ${require_theme.colorize(rich, valueColor, value)}`;
};
/** Formats thrown health errors with rich detail lines when terminal color is enabled. */
function formatHealthCheckFailure(err, opts = {}) {
	const rich = opts.rich ?? require_theme.isRich();
	const raw = String(err);
	const message = err instanceof Error ? err.message : raw;
	if (!rich) return `Health check failed: ${raw}`;
	const lines = message.split("\n").map((l) => l.trimEnd()).filter(Boolean);
	const detailsIdx = lines.findIndex((l) => l.startsWith("Gateway target: "));
	const summaryLines = (detailsIdx >= 0 ? lines.slice(0, detailsIdx) : lines).map((l) => l.trim()).filter(Boolean);
	const detailLines = detailsIdx >= 0 ? lines.slice(detailsIdx) : [];
	const summary = summaryLines.length > 0 ? summaryLines.join(" ") : message;
	const out = [`${require_theme.colorize(rich, require_theme.theme.error.bold, "Health check failed")}: ${summary}`];
	for (const line of detailLines) out.push(`  ${formatKv(line, rich)}`);
	return out.join("\n");
}
const formatProbeLine = (probe, opts = {}) => {
	const record = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(probe);
	if (!record) return null;
	const ok = typeof record.ok === "boolean" ? record.ok : void 0;
	if (ok === void 0) return null;
	const elapsedMs = typeof record.elapsedMs === "number" ? record.elapsedMs : null;
	const status = typeof record.status === "number" ? record.status : null;
	const error = typeof record.error === "string" ? record.error : null;
	const bot = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(record.bot);
	const botUsername = bot && typeof bot.username === "string" ? bot.username : null;
	const webhook = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(record.webhook);
	const webhookUrl = webhook && typeof webhook.url === "string" ? webhook.url : null;
	const usernames = /* @__PURE__ */ new Set();
	if (botUsername) usernames.add(botUsername);
	for (const extra of opts.botUsernames ?? []) if (extra) usernames.add(extra);
	if (ok) {
		let label = "ok";
		if (usernames.size > 0) label += ` (@${Array.from(usernames).join(", @")})`;
		if (elapsedMs != null) label += ` (${elapsedMs}ms)`;
		if (webhookUrl) label += ` - webhook ${webhookUrl}`;
		return label;
	}
	let label = `failed (${status ?? "unknown"})`;
	if (error) label += ` - ${error}`;
	return label;
};
const formatAccountProbeTiming = (summary) => {
	const probe = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(summary.probe);
	if (!probe) return null;
	const elapsedMs = typeof probe.elapsedMs === "number" ? Math.round(probe.elapsedMs) : null;
	const ok = typeof probe.ok === "boolean" ? probe.ok : null;
	if (elapsedMs == null && ok !== true) return null;
	const accountId = summary.accountId || "default";
	const botRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(probe.bot);
	const botUsername = botRecord && typeof botRecord.username === "string" ? botRecord.username : null;
	return `${botUsername ? `@${botUsername}` : accountId}:${accountId}:${elapsedMs != null ? `${elapsedMs}ms` : "ok"}`;
};
const isProbeFailure = (summary) => {
	const probe = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(summary.probe);
	if (!probe) return false;
	return (typeof probe.ok === "boolean" ? probe.ok : null) === false;
};
/** Formats one terse health line per channel, optionally including every account. */
const formatHealthChannelLines = (summary, opts = {}) => {
	const channels = summary.channels ?? {};
	const channelOrder = summary.channelOrder?.length > 0 ? summary.channelOrder : Object.keys(channels);
	const accountMode = opts.accountMode ?? "default";
	const lines = [];
	for (const channelId of channelOrder) {
		const channelSummary = channels[channelId];
		if (!channelSummary) continue;
		const label = summary.channelLabels?.[channelId] ?? channelId;
		const accountSummaries = channelSummary.accounts ?? {};
		const accountIds = opts.accountIdsByChannel?.[channelId];
		const filteredSummaries = accountIds && accountIds.length > 0 ? accountIds.map((accountId) => accountSummaries[accountId]).filter((entry) => Boolean(entry)) : void 0;
		const listSummaries = accountMode === "all" ? Object.values(accountSummaries) : filteredSummaries ?? (channelSummary.accounts ? Object.values(accountSummaries) : []);
		const selectedSummary = (0, _gabrielvfonseca_normalization_core.expectDefined)(filteredSummaries && filteredSummaries.length > 0 ? filteredSummaries[0] : channelSummary, "channel health summary");
		const botUsernames = listSummaries ? listSummaries.map((account) => {
			const probeRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(account.probe);
			const bot = probeRecord ? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableRecord)(probeRecord.bot) : null;
			return bot && typeof bot.username === "string" ? bot.username : null;
		}).filter((value) => Boolean(value)) : [];
		const statusState = typeof selectedSummary.statusState === "string" ? selectedSummary.statusState : null;
		if (statusState) {
			if (statusState === "linked") {
				const authAgeMs = typeof selectedSummary.authAgeMs === "number" ? selectedSummary.authAgeMs : null;
				const authLabel = authAgeMs != null ? ` (auth age ${Math.round(authAgeMs / 6e4)}m)` : "";
				lines.push(`${label}: ${require_status_state.formatChannelStatusState(statusState)}${authLabel}`);
			} else lines.push(`${label}: ${require_status_state.formatChannelStatusState(statusState)}`);
			continue;
		}
		const linked = typeof selectedSummary.linked === "boolean" ? selectedSummary.linked : null;
		if (linked !== null) {
			if (linked) {
				const authAgeMs = typeof selectedSummary.authAgeMs === "number" ? selectedSummary.authAgeMs : null;
				const authLabel = authAgeMs != null ? ` (auth age ${Math.round(authAgeMs / 6e4)}m)` : "";
				lines.push(`${label}: linked${authLabel}`);
			} else lines.push(`${label}: not linked`);
			continue;
		}
		const configured = typeof selectedSummary.configured === "boolean" ? selectedSummary.configured : null;
		if (configured === false) {
			lines.push(`${label}: not configured`);
			continue;
		}
		const accountTimings = accountMode === "all" ? listSummaries.map((account) => formatAccountProbeTiming(account)).filter((value) => Boolean(value)) : [];
		const failedSummary = listSummaries.find((summaryLocal) => isProbeFailure(summaryLocal));
		if (failedSummary) {
			const failureLine = formatProbeLine(failedSummary.probe, { botUsernames });
			if (failureLine) {
				lines.push(`${label}: ${failureLine}`);
				continue;
			}
		}
		if (accountTimings.length > 0) {
			lines.push(`${label}: ok (${accountTimings.join(", ")})`);
			continue;
		}
		const probeLine = formatProbeLine(selectedSummary.probe, { botUsernames });
		if (probeLine) {
			lines.push(`${label}: ${probeLine}`);
			continue;
		}
		if (configured === true) {
			lines.push(`${label}: configured`);
			continue;
		}
		lines.push(`${label}: unknown`);
	}
	return lines;
};
//#endregion
Object.defineProperty(exports, "formatGatewayClosedDiagnostic", {
	enumerable: true,
	get: function() {
		return formatGatewayClosedDiagnostic;
	}
});
Object.defineProperty(exports, "formatHealthChannelLines", {
	enumerable: true,
	get: function() {
		return formatHealthChannelLines;
	}
});
Object.defineProperty(exports, "formatHealthCheckFailure", {
	enumerable: true,
	get: function() {
		return formatHealthCheckFailure;
	}
});
