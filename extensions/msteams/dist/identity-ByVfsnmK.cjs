let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/auth-profiles/identity.ts
/**
* Auth profile id and display metadata helpers.
* Keeps profile id construction and human metadata lookup centralized for auth
* status, storage, and provider selection.
*/
function resolveStoredMetadata(store, profileId) {
	const profile = store?.profiles[profileId];
	if (!profile) return {};
	return {
		displayName: "displayName" in profile ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(profile.displayName) : void 0,
		email: "email" in profile ? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(profile.email) : void 0
	};
}
/** Resolves display metadata for an auth profile from config/store. */
function resolveAuthProfileMetadata(params) {
	const configured = params.cfg?.auth?.profiles?.[params.profileId];
	const stored = resolveStoredMetadata(params.store, params.profileId);
	return {
		displayName: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configured?.displayName) ?? stored.displayName,
		email: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(configured?.email) ?? stored.email
	};
}
//#endregion
Object.defineProperty(exports, "resolveAuthProfileMetadata", {
	enumerable: true,
	get: function() {
		return resolveAuthProfileMetadata;
	}
});
