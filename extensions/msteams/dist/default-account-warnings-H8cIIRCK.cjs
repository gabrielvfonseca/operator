require("./rolldown-runtime-u92d-OFm.cjs");
const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
const require_bindings = require("./bindings-CyUjIovi.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/routing/default-account-warnings.ts
function formatChannelDefaultAccountPath(channelKey) {
	return `channels.${channelKey}.defaultAccount`;
}
function formatChannelAccountsDefaultPath(channelKey) {
	return `channels.${channelKey}.accounts.default`;
}
function formatSetExplicitDefaultInstruction(channelKey) {
	return `Set ${formatChannelDefaultAccountPath(channelKey)} or add ${formatChannelAccountsDefaultPath(channelKey)}`;
}
function formatSetExplicitDefaultToConfiguredInstruction(params) {
	return `Set ${formatChannelDefaultAccountPath(params.channelKey)} to one of these accounts, or add ${formatChannelAccountsDefaultPath(params.channelKey)}`;
}
//#endregion
//#region src/commands/doctor/shared/default-account-warnings.ts
function normalizeBindingChannelKey(raw) {
	const normalized = require_ids.normalizeChatChannelId(raw);
	if (normalized) return normalized;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(raw);
}
function collectChannelsMissingDefaultAccount(cfg) {
	const channels = require_object.asObjectRecord(cfg.channels);
	if (!channels) return [];
	const contexts = [];
	for (const [channelKey, rawChannel] of Object.entries(channels)) {
		const channel = require_object.asObjectRecord(rawChannel);
		if (!channel) continue;
		const accounts = require_object.asObjectRecord(channel.accounts);
		if (!accounts) continue;
		const normalizedAccountIds = Array.from(new Set(Object.keys(accounts).map((accountId) => require_account_id.normalizeAccountId(accountId)).filter(Boolean))).toSorted((a, b) => a.localeCompare(b));
		if (normalizedAccountIds.length === 0 || normalizedAccountIds.includes("default")) continue;
		contexts.push({
			channelKey,
			channel,
			normalizedAccountIds
		});
	}
	return contexts;
}
/** Warn when account-scoped route bindings do not cover channels without accounts.default. */
function collectMissingDefaultAccountBindingWarnings(cfg) {
	const bindings = require_bindings.listRouteBindings(cfg);
	const warnings = [];
	for (const { channelKey, normalizedAccountIds } of collectChannelsMissingDefaultAccount(cfg)) {
		const accountIdSet = new Set(normalizedAccountIds);
		const channelPattern = normalizeBindingChannelKey(channelKey);
		let hasWildcardBinding = false;
		const coveredAccountIds = /* @__PURE__ */ new Set();
		for (const binding of bindings) {
			const bindingRecord = require_object.asObjectRecord(binding);
			if (!bindingRecord) continue;
			const match = require_object.asObjectRecord(bindingRecord.match);
			if (!match) continue;
			const matchChannel = typeof match.channel === "string" ? normalizeBindingChannelKey(match.channel) : "";
			if (!matchChannel || matchChannel !== channelPattern) continue;
			const rawAccountId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(match.accountId) ?? "";
			if (!rawAccountId) continue;
			if (rawAccountId === "*") {
				hasWildcardBinding = true;
				continue;
			}
			const normalizedBindingAccountId = require_account_id.normalizeAccountId(rawAccountId);
			if (accountIdSet.has(normalizedBindingAccountId)) coveredAccountIds.add(normalizedBindingAccountId);
		}
		if (hasWildcardBinding) continue;
		const uncoveredAccountIds = normalizedAccountIds.filter((accountId) => !coveredAccountIds.has(accountId));
		if (uncoveredAccountIds.length === 0) continue;
		if (coveredAccountIds.size > 0) {
			warnings.push(`- channels.${channelKey}: accounts.default is missing and account bindings only cover a subset of configured accounts. Uncovered accounts: ${uncoveredAccountIds.join(", ")}. Add bindings[].match.accountId for uncovered accounts (or "*"), or add ${formatChannelAccountsDefaultPath(channelKey)}.`);
			continue;
		}
		warnings.push(`- channels.${channelKey}: accounts.default is missing and no valid account-scoped binding exists for configured accounts (${normalizedAccountIds.join(", ")}). Channel-only bindings (no accountId) match only default. Add bindings[].match.accountId for one of these accounts (or "*"), or add ${formatChannelAccountsDefaultPath(channelKey)}.`);
	}
	return warnings;
}
/** Warn when multi-account channels omit or misconfigure an explicit default account. */
function collectMissingExplicitDefaultAccountWarnings(cfg) {
	const warnings = [];
	for (const { channelKey, channel, normalizedAccountIds } of collectChannelsMissingDefaultAccount(cfg)) {
		if (normalizedAccountIds.length < 2) continue;
		const preferredDefault = require_account_id.normalizeOptionalAccountId(typeof channel.defaultAccount === "string" ? channel.defaultAccount : void 0);
		if (preferredDefault) {
			if (normalizedAccountIds.includes(preferredDefault)) continue;
			warnings.push(`- channels.${channelKey}: defaultAccount is set to "${preferredDefault}" but does not match configured accounts (${normalizedAccountIds.join(", ")}). ${formatSetExplicitDefaultToConfiguredInstruction({ channelKey })} to avoid fallback routing.`);
			continue;
		}
		warnings.push(`- channels.${channelKey}: multiple accounts are configured but no explicit default is set. ${formatSetExplicitDefaultInstruction(channelKey)} to avoid fallback routing.`);
	}
	return warnings;
}
//#endregion
exports.collectMissingDefaultAccountBindingWarnings = collectMissingDefaultAccountBindingWarnings;
exports.collectMissingExplicitDefaultAccountWarnings = collectMissingExplicitDefaultAccountWarnings;
