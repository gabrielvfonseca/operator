const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_oauth = require("./oauth-D9-_YxyQ.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_source_check = require("./source-check-bi20wzmV.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profiles = require("./profiles-m8TkqupR.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
const require_identity = require("./identity-ByVfsnmK.cjs");
const require_repair = require("./repair-DpRcksFG.cjs");
const require_usage = require("./usage-BS7X-z0p.cjs");
const require_external_cli_discovery = require("./external-cli-discovery-Dlv6FCg5.cjs");
const require_usage_state = require("./usage-state-CfaEuTkC.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
const require_failure_hook = require("./failure-hook-Otwiooy3.cjs");
//#region src/agents/auth-profiles/display.ts
/** Builds the human-readable profile label used in status and auth listings. */
function resolveAuthProfileDisplayLabel(params) {
	const { displayName, email } = require_identity.resolveAuthProfileMetadata(params);
	if (displayName) return `${params.profileId} (${displayName})`;
	if (email) return `${params.profileId} (${email})`;
	return params.profileId;
}
//#endregion
//#region src/agents/auth-profiles/portability.ts
/**
* Auth profile portability for agent-local copies.
* Decides which credentials can be copied to spawned agents without leaking or
* duplicating unsafe OAuth refresh material.
*/
function hasAgentCopyOverride(credential) {
	return typeof credential.copyToAgents === "boolean" ? credential.copyToAgents : void 0;
}
function hasCopyableOAuthMaterial(credential) {
	if (credential.type !== "oauth") return false;
	return [credential.access, credential.refresh].some((value) => typeof value === "string" && value.trim().length > 0);
}
/** Resolves whether a credential can be copied into an agent-local store. */
function resolveAuthProfilePortability(credential) {
	const override = hasAgentCopyOverride(credential);
	if (override === false) return {
		portable: false,
		reason: "credential-opted-out"
	};
	if (credential.type === "oauth") {
		if (!hasCopyableOAuthMaterial(credential)) return {
			portable: false,
			reason: "non-portable-oauth-refresh-token"
		};
		return override === true ? {
			portable: true,
			reason: "oauth-provider-opted-in"
		} : {
			portable: false,
			reason: "non-portable-oauth-refresh-token"
		};
	}
	return {
		portable: true,
		reason: "portable-static-credential"
	};
}
/** Returns true when a credential can be copied into an agent-local store. */
function isAuthProfileCredentialPortableForAgentCopy(credential) {
	return resolveAuthProfilePortability(credential).portable;
}
/** Builds an agent-copy store containing only portable credentials and their order. */
function buildPortableAuthProfileStoreForAgentCopy(store) {
	const copiedProfileIds = [];
	const skippedProfileIds = [];
	const profiles = Object.fromEntries(Object.entries(store.profiles).flatMap(([profileId, credential]) => {
		if (!isAuthProfileCredentialPortableForAgentCopy(credential)) {
			skippedProfileIds.push(profileId);
			return [];
		}
		copiedProfileIds.push(profileId);
		return [[profileId, credential]];
	}));
	const copiedSet = new Set(copiedProfileIds);
	const order = Object.fromEntries(Object.entries(store.order ?? {}).map(([provider, ids]) => [provider, ids.filter((id) => copiedSet.has(id))]).filter(([, ids]) => ids.length > 0));
	return {
		store: {
			version: 1,
			profiles,
			...Object.keys(order).length > 0 ? { order } : {}
		},
		copiedProfileIds,
		skippedProfileIds
	};
}
//#endregion
//#region src/agents/auth-profiles.ts
var auth_profiles_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	CLAUDE_CLI_PROFILE_ID: () => require_persisted.CLAUDE_CLI_PROFILE_ID,
	CODEX_CLI_PROFILE_ID: () => require_persisted.CODEX_CLI_PROFILE_ID,
	buildPortableAuthProfileStoreForAgentCopy: () => buildPortableAuthProfileStoreForAgentCopy,
	calculateAuthProfileCooldownMs: () => require_usage.calculateAuthProfileCooldownMs,
	clearAuthProfileCooldown: () => require_usage.clearAuthProfileCooldown,
	clearExpiredCooldowns: () => require_usage_state.clearExpiredCooldowns,
	clearRuntimeAuthProfileStoreSnapshot: () => require_store.clearRuntimeAuthProfileStoreSnapshot,
	clearRuntimeAuthProfileStoreSnapshots: () => require_store.clearRuntimeAuthProfileStoreSnapshots,
	dedupeProfileIds: () => require_profile_list.dedupeProfileIds,
	ensureAuthProfileStore: () => require_store.ensureAuthProfileStore,
	ensureAuthProfileStoreWithoutExternalProfiles: () => require_store.ensureAuthProfileStoreWithoutExternalProfiles,
	externalCliDiscoveryForConfigStatus: () => require_external_cli_discovery.externalCliDiscoveryForConfigStatus,
	externalCliDiscoveryForProviderAuth: () => require_external_cli_discovery.externalCliDiscoveryForProviderAuth,
	externalCliDiscoveryForProviders: () => require_external_cli_discovery.externalCliDiscoveryForProviders,
	externalCliDiscoveryScoped: () => require_external_cli_discovery.externalCliDiscoveryScoped,
	findPersistedAuthProfileCredential: () => require_store.findPersistedAuthProfileCredential,
	formatAuthDoctorHint: () => require_oauth.formatAuthDoctorHint,
	getRuntimeAuthProfileStoreSnapshot: () => require_store.getRuntimeAuthProfileStoreSnapshot,
	getSoonestCooldownExpiry: () => require_usage_state.getSoonestCooldownExpiry,
	hasAnyAuthProfileStoreSource: () => require_source_check.hasAnyAuthProfileStoreSource,
	hasAuthProfileStoreSourceForProvider: () => require_source_check.hasAuthProfileStoreSourceForProvider,
	hasLocalAuthProfileStoreSource: () => require_source_check.hasLocalAuthProfileStoreSource,
	isAuthProfileCredentialPortableForAgentCopy: () => isAuthProfileCredentialPortableForAgentCopy,
	isConfiguredAwsSdkAuthProfileForProvider: () => require_order.isConfiguredAwsSdkAuthProfileForProvider,
	isProfileInCooldown: () => require_usage_state.isProfileInCooldown,
	isStoredCredentialCompatibleWithAuthProvider: () => require_order.isStoredCredentialCompatibleWithAuthProvider,
	listProfilesForProvider: () => require_profile_list.listProfilesForProvider,
	loadAuthProfileStore: () => require_store.loadAuthProfileStore,
	loadAuthProfileStoreForRuntime: () => require_store.loadAuthProfileStoreForRuntime,
	loadAuthProfileStoreForSecretsRuntime: () => require_store.loadAuthProfileStoreForSecretsRuntime,
	loadAuthProfileStoreWithoutExternalProfiles: () => require_store.loadAuthProfileStoreWithoutExternalProfiles,
	markAuthProfileBlockedUntil: () => require_usage.markAuthProfileBlockedUntil,
	markAuthProfileCooldown: () => require_usage.markAuthProfileCooldown,
	markAuthProfileFailure: () => require_usage.markAuthProfileFailure,
	markAuthProfileSuccess: () => require_profiles.markAuthProfileSuccess,
	refreshOAuthCredentialForRuntime: () => require_oauth.refreshOAuthCredentialForRuntime,
	removeAuthProfilesWithLock: () => require_profiles.removeAuthProfilesWithLock,
	removeProviderAuthProfilesWithLock: () => require_profiles.removeProviderAuthProfilesWithLock,
	repairOAuthProfileIdMismatch: () => require_repair.repairOAuthProfileIdMismatch,
	replaceRuntimeAuthProfileStoreSnapshots: () => require_store.replaceRuntimeAuthProfileStoreSnapshots,
	resolveApiKeyForProfile: () => require_oauth.resolveApiKeyForProfile,
	resolveAuthProfileDisplayLabel: () => resolveAuthProfileDisplayLabel,
	resolveAuthProfileEligibility: () => require_order.resolveAuthProfileEligibility,
	resolveAuthProfileOrder: () => require_order.resolveAuthProfileOrder,
	resolveAuthProfilePortability: () => resolveAuthProfilePortability,
	resolveAuthStatePathForDisplay: () => require_path_resolve.resolveAuthStatePathForDisplay,
	resolveAuthStorePathForDisplay: () => require_path_resolve.resolveAuthStorePathForDisplay,
	resolvePersistedAuthProfileOwnerAgentDir: () => require_store.resolvePersistedAuthProfileOwnerAgentDir,
	resolveProfileUnusableUntilForDisplay: () => require_usage.resolveProfileUnusableUntilForDisplay,
	resolveProfilesUnavailableReason: () => require_usage.resolveProfilesUnavailableReason,
	resolveSubscriptionAuthModeForProfiles: () => require_profile_list.resolveSubscriptionAuthModeForProfiles,
	saveAuthProfileStore: () => require_store.saveAuthProfileStore,
	setAuthProfileFailureHook: () => require_failure_hook.setAuthProfileFailureHook,
	setAuthProfileOrder: () => require_profiles.setAuthProfileOrder,
	suggestOAuthProfileIdForLegacyDefault: () => require_repair.suggestOAuthProfileIdForLegacyDefault,
	upsertAuthProfile: () => require_profiles.upsertAuthProfile,
	upsertAuthProfileWithLock: () => require_profiles.upsertAuthProfileWithLock
});
//#endregion
Object.defineProperty(exports, "auth_profiles_exports", {
	enumerable: true,
	get: function() {
		return auth_profiles_exports;
	}
});
Object.defineProperty(exports, "buildPortableAuthProfileStoreForAgentCopy", {
	enumerable: true,
	get: function() {
		return buildPortableAuthProfileStoreForAgentCopy;
	}
});
Object.defineProperty(exports, "resolveAuthProfileDisplayLabel", {
	enumerable: true,
	get: function() {
		return resolveAuthProfileDisplayLabel;
	}
});
