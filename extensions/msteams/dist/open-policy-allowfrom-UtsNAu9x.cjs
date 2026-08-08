require("./rolldown-runtime-u92d-OFm.cjs");
const require_ansi = require("./ansi-DY9p-M6m.cjs");
const require_dm_access = require("./dm-access-UxTYSelO.cjs");
const require_object = require("./object-Be4AQnVV.cjs");
const require_channel_capabilities = require("./channel-capabilities-DPMAK62I.cjs");
//#region src/commands/doctor/shared/allow-from-mode.ts
/** Return the allowFrom interpretation mode advertised by a channel's doctor metadata. */
function resolveAllowFromMode(channelName) {
	return require_channel_capabilities.getDoctorChannelCapabilities(channelName).dmAllowFromMode;
}
//#endregion
//#region src/commands/doctor/shared/open-policy-allowfrom.ts
/** Format doctor warnings for open DM policies missing allowFrom wildcards. */
function collectOpenPolicyAllowFromWarnings(params) {
	if (params.changes.length === 0) return [];
	return [...params.changes.map((line) => require_ansi.sanitizeForLog(line)), `- Run "${params.doctorFixCommand}" to add missing allowFrom wildcards.`];
}
/** Add allowFrom wildcards for open DM policies where channel metadata requires them. */
function maybeRepairOpenPolicyAllowFrom(cfg) {
	const channels = cfg.channels;
	if (!channels || typeof channels !== "object") return {
		config: cfg,
		changes: []
	};
	const next = structuredClone(cfg);
	const changes = [];
	const ensureWildcard = (account, prefix, mode) => {
		require_dm_access.ensureOpenDmPolicyAllowFromWildcard({
			entry: account,
			mode,
			pathPrefix: prefix,
			changes
		});
	};
	const nextChannels = next.channels;
	for (const [channelName, channelConfig] of Object.entries(nextChannels)) {
		if (!channelConfig || typeof channelConfig !== "object") continue;
		const allowFromMode = resolveAllowFromMode(channelName);
		ensureWildcard(channelConfig, `channels.${channelName}`, allowFromMode);
		const accounts = require_object.asObjectRecord(channelConfig.accounts);
		if (!accounts) continue;
		for (const [accountName, accountConfig] of Object.entries(accounts)) if (accountConfig && typeof accountConfig === "object") ensureWildcard(accountConfig, `channels.${channelName}.accounts.${accountName}`, allowFromMode);
	}
	if (changes.length === 0) return {
		config: cfg,
		changes: []
	};
	return {
		config: next,
		changes
	};
}
//#endregion
exports.collectOpenPolicyAllowFromWarnings = collectOpenPolicyAllowFromWarnings;
exports.maybeRepairOpenPolicyAllowFrom = maybeRepairOpenPolicyAllowFrom;
exports.resolveAllowFromMode = resolveAllowFromMode;
