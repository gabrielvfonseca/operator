require("./utils-CXqBhRFw.cjs");
const require_read_only_account_inspect = require("./read-only-account-inspect-C03mVmQt.cjs");
const require_account_snapshot_fields = require("./account-snapshot-fields-B_iADxHC.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/channels/account-summary.ts
/**
* Channel account summary helpers.
*
* Builds safe status snapshots and resolves enabled/configured account state.
*/
/**
* Builds the safe account snapshot shown by CLI, gateway, and status summaries.
*/
function buildChannelAccountSnapshot(params) {
	const described = params.plugin.config.describeAccount?.(params.account, params.cfg);
	return require_account_snapshot_fields.redactChannelAccountSnapshotBaseUrl({
		enabled: params.enabled,
		configured: params.configured,
		...require_account_snapshot_fields.projectSafeChannelAccountSnapshotFields(params.account),
		...described,
		accountId: params.accountId
	});
}
/**
* Formats allowFrom entries with a plugin formatter when one exists.
*/
function formatChannelAllowFrom(params) {
	if (params.plugin.config.formatAllowFrom) return params.plugin.config.formatAllowFrom({
		cfg: params.cfg,
		accountId: params.accountId,
		allowFrom: params.allowFrom
	});
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(params.allowFrom);
}
/**
* Resolves whether a channel account should be treated as enabled.
*/
function resolveChannelAccountEnabled(params) {
	if (params.plugin.config.isEnabled) return params.plugin.config.isEnabled(params.account, params.cfg);
	return ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.account) ? params.account.enabled : void 0) !== false;
}
/**
* Resolves whether a channel account has enough configuration to run.
*/
async function resolveChannelAccountConfigured(params) {
	if (params.plugin.config.isConfigured) return await params.plugin.config.isConfigured(params.account, params.cfg);
	if (params.readAccountConfiguredField) return ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.account) ? params.account.configured : void 0) !== false;
	return true;
}
//#endregion
//#region src/channels/account-inspection.ts
/**
* Inspects one channel account using the plugin hook or read-only fallback.
*/
async function inspectChannelAccount(params) {
	return params.plugin.config.inspectAccount?.(params.cfg, params.accountId) ?? await require_read_only_account_inspect.inspectReadOnlyChannelAccount({
		channelId: params.plugin.id,
		cfg: params.cfg,
		accountId: params.accountId
	});
}
/**
* Resolves an inspected channel account plus enabled/configured state for status surfaces.
*/
async function resolveInspectedChannelAccount(params) {
	const sourceInspectedAccount = await inspectChannelAccount({
		plugin: params.plugin,
		cfg: params.sourceConfig,
		accountId: params.accountId
	});
	const resolvedInspectedAccount = await inspectChannelAccount({
		plugin: params.plugin,
		cfg: params.cfg,
		accountId: params.accountId
	});
	const resolvedInspection = resolvedInspectedAccount;
	const sourceInspection = sourceInspectedAccount;
	const resolvedAccount = resolvedInspectedAccount ?? params.plugin.config.resolveAccount(params.cfg, params.accountId);
	const useSourceUnavailableAccount = Boolean(sourceInspectedAccount && require_account_snapshot_fields.hasConfiguredUnavailableCredentialStatus(sourceInspectedAccount) && (!require_account_snapshot_fields.hasResolvedCredentialValue(resolvedAccount) || sourceInspection?.configured === true && resolvedInspection?.configured === false));
	const account = useSourceUnavailableAccount ? sourceInspectedAccount : resolvedAccount;
	const selectedInspection = useSourceUnavailableAccount ? sourceInspection : resolvedInspection;
	return {
		account,
		enabled: selectedInspection?.enabled ?? resolveChannelAccountEnabled({
			plugin: params.plugin,
			account,
			cfg: params.cfg
		}),
		configured: selectedInspection?.configured ?? await resolveChannelAccountConfigured({
			plugin: params.plugin,
			account,
			cfg: params.cfg,
			readAccountConfiguredField: true
		})
	};
}
//#endregion
Object.defineProperty(exports, "buildChannelAccountSnapshot", {
	enumerable: true,
	get: function() {
		return buildChannelAccountSnapshot;
	}
});
Object.defineProperty(exports, "formatChannelAllowFrom", {
	enumerable: true,
	get: function() {
		return formatChannelAllowFrom;
	}
});
Object.defineProperty(exports, "inspectChannelAccount", {
	enumerable: true,
	get: function() {
		return inspectChannelAccount;
	}
});
Object.defineProperty(exports, "resolveChannelAccountConfigured", {
	enumerable: true,
	get: function() {
		return resolveChannelAccountConfigured;
	}
});
Object.defineProperty(exports, "resolveChannelAccountEnabled", {
	enumerable: true,
	get: function() {
		return resolveChannelAccountEnabled;
	}
});
Object.defineProperty(exports, "resolveInspectedChannelAccount", {
	enumerable: true,
	get: function() {
		return resolveInspectedChannelAccount;
	}
});
