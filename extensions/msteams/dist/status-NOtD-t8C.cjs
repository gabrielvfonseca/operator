const require_account_snapshot_fields = require("./account-snapshot-fields-B_iADxHC.cjs");
const require_account_inspection = require("./account-inspection-Dw_dnkQD.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/status.ts
/**
* Channel status snapshot builders.
*
* Combines plugin status hooks, account inspection, and safe account field projection.
*/
async function buildChannelAccountSnapshotFromAccount(params) {
	let snapshot;
	if (params.plugin.status?.buildAccountSnapshot) snapshot = await params.plugin.status.buildAccountSnapshot({
		account: params.account,
		cfg: params.cfg,
		runtime: params.runtime,
		probe: params.probe,
		audit: params.audit
	});
	else {
		const enabled = params.plugin.config.isEnabled ? params.plugin.config.isEnabled(params.account, params.cfg) : params.account && typeof params.account === "object" ? params.account.enabled : void 0;
		const configured = params.account && typeof params.account === "object" && "configured" in params.account ? params.account.configured : params.plugin.config.isConfigured ? await params.plugin.config.isConfigured(params.account, params.cfg) : void 0;
		snapshot = {
			accountId: params.accountId,
			enabled,
			configured,
			...require_account_snapshot_fields.projectSafeChannelAccountSnapshotFields(params.account),
			...require_account_snapshot_fields.projectSafeChannelAccountSnapshotFields(params.runtime)
		};
	}
	return require_account_snapshot_fields.redactChannelAccountSnapshotBaseUrl({
		...snapshot,
		accountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(snapshot.accountId) ? snapshot.accountId : params.accountId,
		enabled: snapshot.enabled ?? params.enabledFallback,
		configured: snapshot.configured ?? params.configuredFallback,
		...params.probe !== void 0 && snapshot.probe === void 0 ? { probe: params.probe } : {}
	});
}
async function buildChannelAccountSnapshot(params) {
	const account = await require_account_inspection.inspectChannelAccount(params) ?? params.plugin.config.resolveAccount(params.cfg, params.accountId);
	return await buildChannelAccountSnapshotFromAccount({
		...params,
		account
	});
}
//#endregion
Object.defineProperty(exports, "buildChannelAccountSnapshot", {
	enumerable: true,
	get: function() {
		return buildChannelAccountSnapshot;
	}
});
Object.defineProperty(exports, "buildChannelAccountSnapshotFromAccount", {
	enumerable: true,
	get: function() {
		return buildChannelAccountSnapshotFromAccount;
	}
});
