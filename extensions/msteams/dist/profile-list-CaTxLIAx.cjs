const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/auth-profiles/profile-list.ts
/**
* Auth profile list helpers.
* Provides provider-compatible profile lookup and stable de-duplication used by
* ordering, repair, and profile mutation paths.
*/
/** Deduplicates profile ids while preserving first-seen order. */
function dedupeProfileIds(profileIds) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(profileIds);
}
/** Lists auth profile ids whose credential provider matches the requested provider. */
function listProfilesForProvider(store, provider) {
	const providerKey = require_provider_auth_aliases.resolveProviderIdForAuth(provider);
	return Object.entries(store.profiles).filter(([, cred]) => require_provider_auth_aliases.resolveProviderIdForAuth(cred.provider) === providerKey).map(([id]) => id);
}
function resolveSubscriptionAuthModeForProfiles(params) {
	for (const profileId of params.profileIds) {
		const type = profileId ? params.store.profiles[profileId]?.type : void 0;
		if (type === "oauth" || type === "token") return type;
	}
}
//#endregion
Object.defineProperty(exports, "dedupeProfileIds", {
	enumerable: true,
	get: function() {
		return dedupeProfileIds;
	}
});
Object.defineProperty(exports, "listProfilesForProvider", {
	enumerable: true,
	get: function() {
		return listProfilesForProvider;
	}
});
Object.defineProperty(exports, "resolveSubscriptionAuthModeForProfiles", {
	enumerable: true,
	get: function() {
		return resolveSubscriptionAuthModeForProfiles;
	}
});
