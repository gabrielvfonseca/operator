require("./rolldown-runtime-u92d-OFm.cjs");
const require_read_only = require("./read-only-MDrE_ZGP.cjs");
const require_channel_account_context = require("./channel-account-context-BNMpPvGe.cjs");
//#region src/commands/status.link-channel.ts
/** Returns link status for the first configured read-only channel that exposes linked state. */
async function resolveLinkChannelContext(cfg, options = {}) {
	const sourceConfig = options.sourceConfig ?? cfg;
	for (const plugin of require_read_only.listReadOnlyChannelPluginsForConfig(cfg, {
		activationSourceConfig: sourceConfig,
		includeSetupFallbackPlugins: false
	})) {
		const { defaultAccountId, account, enabled, configured } = await require_channel_account_context.resolveDefaultChannelAccountContext(plugin, cfg, {
			mode: "read_only",
			commandName: "status"
		});
		const snapshot = plugin.config.describeAccount ? plugin.config.describeAccount(account, cfg) : {
			accountId: defaultAccountId,
			enabled,
			configured
		};
		const summaryRecord = plugin.status?.buildChannelSummary ? await plugin.status.buildChannelSummary({
			account,
			cfg,
			defaultAccountId,
			snapshot
		}) : void 0;
		const linked = summaryRecord && typeof summaryRecord.linked === "boolean" ? summaryRecord.linked : null;
		if (linked === null) continue;
		return {
			linked,
			authAgeMs: summaryRecord && typeof summaryRecord.authAgeMs === "number" ? summaryRecord.authAgeMs : null,
			account,
			accountId: defaultAccountId,
			plugin
		};
	}
	return null;
}
//#endregion
exports.resolveLinkChannelContext = resolveLinkChannelContext;
