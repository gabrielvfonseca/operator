const require_boolean = require("./boolean-DrgQ-UMw.cjs");
//#region src/config/dangerous-name-matching.ts
function asObjectRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value;
}
/** Returns true only for the explicit dangerous name-matching opt-in flag. */
function isDangerousNameMatchingEnabled(config) {
	return config?.dangerouslyAllowNameMatching === true;
}
/** Collects provider/account scopes that policy and doctor surfaces can audit. */
function collectProviderDangerousNameMatchingScopes(cfg, provider) {
	const scopes = [];
	const channels = asObjectRecord(cfg.channels);
	if (!channels) return scopes;
	const providerCfg = asObjectRecord(channels[provider]);
	if (!providerCfg) return scopes;
	const providerPrefix = `channels.${provider}`;
	const providerDangerousFlagPath = `${providerPrefix}.dangerouslyAllowNameMatching`;
	const providerDangerousNameMatchingEnabled = isDangerousNameMatchingEnabled(providerCfg);
	scopes.push({
		prefix: providerPrefix,
		account: providerCfg,
		dangerousNameMatchingEnabled: providerDangerousNameMatchingEnabled,
		dangerousFlagPath: providerDangerousFlagPath
	});
	const accounts = asObjectRecord(providerCfg.accounts);
	if (!accounts) return scopes;
	for (const key of Object.keys(accounts)) {
		const account = asObjectRecord(accounts[key]);
		if (!account) continue;
		const accountPrefix = `${providerPrefix}.accounts.${key}`;
		const accountDangerousNameMatching = require_boolean.asBoolean(account.dangerouslyAllowNameMatching);
		scopes.push({
			prefix: accountPrefix,
			account,
			dangerousNameMatchingEnabled: accountDangerousNameMatching ?? providerDangerousNameMatchingEnabled,
			dangerousFlagPath: accountDangerousNameMatching == null ? providerDangerousFlagPath : `${accountPrefix}.dangerouslyAllowNameMatching`
		});
	}
	return scopes;
}
//#endregion
Object.defineProperty(exports, "collectProviderDangerousNameMatchingScopes", {
	enumerable: true,
	get: function() {
		return collectProviderDangerousNameMatchingScopes;
	}
});
Object.defineProperty(exports, "isDangerousNameMatchingEnabled", {
	enumerable: true,
	get: function() {
		return isDangerousNameMatchingEnabled;
	}
});
