require("./rolldown-runtime-u92d-OFm.cjs");
const require_command_format = require("./command-format-C4ZW2nwK.cjs");
const require_theme = require("./theme-DwRpEiJc.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_format_relative = require("./format-relative-DEaTzxP-.cjs");
const require_table = require("./table-B4dxfer5.cjs");
const require_status = require("./status-pSULYkKm.cjs");
const require_health_format = require("./health-format-Cxf7oLqH.cjs");
const require_update_check = require("./update-check-yvbRd7TR.cjs");
const require_status_update = require("./status.update-DbYS8XkD.cjs");
const require_format = require("./format-Y6on_ttU.cjs");
const require_channels_table = require("./channels-table-CCPwjWsS.cjs");
//#region src/commands/text-format.ts
/** Shortens text to maxLen code points, appending an ellipsis when truncated. */
const shortenText = (value, maxLen) => {
	if (maxLen <= 0) return "";
	const chars = Array.from(value);
	if (chars.length <= maxLen) return value;
	return `${chars.slice(0, Math.max(0, maxLen - 1)).join("")}…`;
};
//#endregion
//#region packages/memory-host-sdk/src/host/status-format.ts
/** Resolve vector indexing state from enabled and availability flags. */
function resolveMemoryVectorState(vector) {
	if (!vector.enabled) return {
		tone: "muted",
		state: "disabled"
	};
	if (vector.available === true) return {
		tone: "ok",
		state: "ready"
	};
	if (vector.available === false) return {
		tone: "warn",
		state: "unavailable"
	};
	return {
		tone: "muted",
		state: "unknown"
	};
}
/** Resolve full-text search state from enabled and availability flags. */
function resolveMemoryFtsState(fts) {
	if (!fts.enabled) return {
		tone: "muted",
		state: "disabled"
	};
	return fts.available ? {
		tone: "ok",
		state: "ready"
	} : {
		tone: "warn",
		state: "unavailable"
	};
}
/** Format cache state as concise status text with optional entry count. */
function resolveMemoryCacheSummary(cache) {
	if (!cache.enabled) return {
		tone: "muted",
		text: "cache off"
	};
	return {
		tone: "ok",
		text: `cache on${typeof cache.entries === "number" ? ` (${cache.entries})` : ""}`
	};
}
//#endregion
exports.buildGatewayStatusSummaryParts = require_format.buildGatewayStatusSummaryParts;
exports.buildStatusChannelsTableRows = require_channels_table.buildStatusChannelsTableRows;
exports.buildStatusGatewaySurfaceValues = require_format.buildStatusGatewaySurfaceValues;
exports.buildStatusOverviewRows = require_format.buildStatusOverviewRows;
exports.buildStatusOverviewSurfaceRows = require_format.buildStatusOverviewSurfaceRows;
exports.buildStatusUpdateSurface = require_format.buildStatusUpdateSurface;
exports.formatCliCommand = require_command_format.formatCliCommand;
exports.formatDuration = require_channels_table.formatDuration;
exports.formatGatewayAuthUsed = require_format.formatGatewayAuthUsed;
exports.formatGatewaySelfSummary = require_format.formatGatewaySelfSummary;
exports.formatGitInstallLabel = require_update_check.formatGitInstallLabel;
exports.formatHealthChannelLines = require_health_format.formatHealthChannelLines;
exports.formatKTokens = require_channels_table.formatKTokens;
exports.formatPluginCompatibilityNotice = require_status.formatPluginCompatibilityNotice;
exports.formatPromptCacheCompact = require_channels_table.formatPromptCacheCompact;
exports.formatStatusDashboardValue = require_format.formatStatusDashboardValue;
exports.formatStatusServiceValue = require_format.formatStatusServiceValue;
exports.formatStatusTailscaleValue = require_format.formatStatusTailscaleValue;
exports.formatTimeAgo = require_format_relative.formatTimeAgo;
exports.formatTokensCompact = require_channels_table.formatTokensCompact;
exports.formatUpdateAvailableHint = require_status_update.formatUpdateAvailableHint;
exports.getTerminalTableWidth = require_table.getTerminalTableWidth;
exports.groupChannelIssuesByChannel = require_channels_table.groupChannelIssuesByChannel;
exports.info = require_globals.info;
exports.renderTable = require_table.renderTable;
exports.resolveMemoryCacheSummary = resolveMemoryCacheSummary;
exports.resolveMemoryFtsState = resolveMemoryFtsState;
exports.resolveMemoryVectorState = resolveMemoryVectorState;
exports.resolveStatusDashboardUrl = require_format.resolveStatusDashboardUrl;
exports.resolveStatusUpdateChannelInfo = require_format.resolveStatusUpdateChannelInfo;
exports.shortenText = shortenText;
exports.statusChannelsTableColumns = require_channels_table.statusChannelsTableColumns;
exports.summarizePluginCompatibility = require_status.summarizePluginCompatibility;
exports.theme = require_theme.theme;
