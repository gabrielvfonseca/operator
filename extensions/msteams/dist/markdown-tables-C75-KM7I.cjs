const require_account_id = require("./account-id-Di7YWYh4.cjs");
const require_account_lookup = require("./account-lookup-Bt7ehEAK.cjs");
require("./session-key-BQFkCTNx.cjs");
require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
//#region src/config/markdown-tables.ts
function buildDefaultTableModes() {
	return new Map(require_registry.listChannelPlugins().flatMap((plugin) => {
		const defaultMarkdownTableMode = plugin.messaging?.defaultMarkdownTableMode;
		return defaultMarkdownTableMode ? [[plugin.id, defaultMarkdownTableMode]] : [];
	}).toSorted(([left], [right]) => left.localeCompare(right)));
}
let cachedDefaultTableModes = null;
let cachedDefaultTableModesRegistryVersion = null;
function getDefaultTableModes() {
	const registryVersion = require_runtime.getActivePluginChannelRegistryVersion();
	if (!cachedDefaultTableModes || cachedDefaultTableModesRegistryVersion !== registryVersion) {
		cachedDefaultTableModes = buildDefaultTableModes();
		cachedDefaultTableModesRegistryVersion = registryVersion;
	}
	return cachedDefaultTableModes;
}
const isMarkdownTableMode = (value) => value === "off" || value === "bullets" || value === "code" || value === "block";
function resolveMarkdownModeFromSection(section, accountId) {
	if (!section) return;
	const normalizedAccountId = require_account_id.normalizeAccountId(accountId);
	const accounts = section.accounts;
	if (accounts && typeof accounts === "object") {
		const matchMode = require_account_lookup.resolveAccountEntry(accounts, normalizedAccountId)?.markdown?.tables;
		if (isMarkdownTableMode(matchMode)) return matchMode;
	}
	const sectionMode = section.markdown?.tables;
	return isMarkdownTableMode(sectionMode) ? sectionMode : void 0;
}
function resolveMarkdownTableMode(params) {
	const channel = require_registry.normalizeChannelId(params.channel);
	const defaultMode = channel ? getDefaultTableModes().get(channel) ?? "code" : "code";
	let resolved = defaultMode;
	if (channel && params.cfg) {
		const channelsConfig = params.cfg.channels;
		const rootConfig = params.cfg;
		resolved = resolveMarkdownModeFromSection(channelsConfig?.[channel] ?? rootConfig[channel], params.accountId) ?? defaultMode;
	}
	return resolved === "block" && !params.supportsBlockTables ? "code" : resolved;
}
//#endregion
Object.defineProperty(exports, "resolveMarkdownTableMode", {
	enumerable: true,
	get: function() {
		return resolveMarkdownTableMode;
	}
});
