const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_normalize_secret_input = require("./normalize-secret-input-Dg82qiNj.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
const require_profile_list = require("./profile-list-CaTxLIAx.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/agents/auth-profiles/credential-normalize.ts
function normalizeAuthProfileCredential(credential) {
	if (credential.type === "api_key") {
		if (typeof credential.key !== "string") return credential;
		const { key: _key, ...rest } = credential;
		const key = require_normalize_secret_input.normalizeSecretInput(credential.key);
		return {
			...rest,
			...key ? { key } : {}
		};
	}
	if (credential.type === "token") {
		if (typeof credential.token !== "string") return credential;
		const { token: _token, ...rest } = credential;
		const token = require_normalize_secret_input.normalizeSecretInput(credential.token);
		return {
			...rest,
			...token ? { token } : {}
		};
	}
	return credential;
}
//#endregion
//#region src/agents/auth-profiles/upsert-with-lock.ts
/**
* Locked auth profile upsert helper.
* Normalizes literal secrets before persistence and routes all writes through
* the shared SQLite lock to avoid racing concurrent auth updates.
*/
/** Upserts an auth profile under the store lock, returning null on store write failure. */
async function upsertAuthProfileWithLock(params) {
	const credential = normalizeAuthProfileCredential(params.credential);
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		saveOptions: {
			filterExternalAuthProfiles: false,
			syncExternalCli: false
		},
		updater: (store) => {
			store.profiles[params.profileId] = credential;
			return true;
		}
	});
}
//#endregion
//#region src/agents/auth-profiles/profiles.ts
/**
* Auth profile mutation helpers.
* Updates profile order, last-good state, usage stats, and provider profile
* records through locked or immediate store writes.
*/
const authProfileProfilesLog = require_subsystem.createSubsystemLogger("agent/embedded");
function findProviderAuthStateKey(entries, providerKey) {
	if (!entries) return;
	const normalizedProviderKey = require_provider_auth_aliases.resolveProviderIdForAuth(providerKey);
	return Object.keys(entries).find((key) => require_provider_auth_aliases.resolveProviderIdForAuth(key) === normalizedProviderKey);
}
function resetSuccessfulUsageStats(existing, lastUsed) {
	return {
		...existing,
		errorCount: 0,
		blockedUntil: void 0,
		blockedReason: void 0,
		blockedSource: void 0,
		blockedModel: void 0,
		cooldownUntil: void 0,
		cooldownReason: void 0,
		cooldownModel: void 0,
		disabledUntil: void 0,
		disabledReason: void 0,
		failureCounts: void 0,
		lastUsed
	};
}
function updateSuccessfulUsageStatsEntry(store, profileId, lastUsed) {
	store.usageStats = store.usageStats ?? {};
	store.usageStats[profileId] = resetSuccessfulUsageStats(store.usageStats[profileId], lastUsed);
}
/** Sets or clears explicit auth profile order for a provider. */
async function setAuthProfileOrder(params) {
	const providerKey = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const deduped = require_profile_list.dedupeProfileIds(params.order && Array.isArray(params.order) ? (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(params.order) : []);
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (store) => {
			store.order = store.order ?? {};
			if (deduped.length === 0) {
				if (!store.order[providerKey]) return false;
				delete store.order[providerKey];
				if (Object.keys(store.order).length === 0) store.order = void 0;
				return true;
			}
			store.order[providerKey] = deduped;
			return true;
		}
	});
}
/** Promotes one auth profile to the front of a provider order. */
async function promoteAuthProfileInOrder(params) {
	const providerKey = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider);
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		...params.createFromOrder ? { saveOptions: { preserveOrderProfileIds: params.createFromOrder } } : {},
		updater: (store) => {
			const profile = store.profiles[params.profileId];
			if (!profile || require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider) !== providerKey) return false;
			const orderKey = findProviderAuthStateKey(store.order, providerKey) ?? (0, _gabrielvfonseca_model_catalog_core_provider_id.findNormalizedProviderKey)(store.order, providerKey) ?? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerKey);
			const existing = store.order?.[orderKey];
			if (!existing || existing.length === 0) {
				if (!params.createIfMissing) return false;
				const providerProfiles = require_profile_list.dedupeProfileIds(params.createFromOrder !== void 0 ? params.createFromOrder : require_profile_list.listProfilesForProvider(store, providerKey));
				const next = require_profile_list.dedupeProfileIds([params.profileId, ...providerProfiles.filter((profileId) => profileId !== params.profileId)]);
				store.order = {
					...store.order,
					[orderKey]: next
				};
				return true;
			}
			const next = require_profile_list.dedupeProfileIds([params.profileId, ...existing.filter((profileId) => profileId !== params.profileId)]);
			if (next.length === existing.length && next.every((profileId, idx) => profileId === existing[idx])) return false;
			store.order = {
				...store.order,
				[orderKey]: next
			};
			return true;
		}
	});
}
/** Upserts an auth profile immediately into the local store. */
function upsertAuthProfile(params) {
	const credential = normalizeAuthProfileCredential(params.credential);
	const store = require_store.ensureAuthProfileStoreForLocalUpdate(params.agentDir);
	store.profiles[params.profileId] = credential;
	require_store.saveAuthProfileStore(store, params.agentDir, {
		filterExternalAuthProfiles: false,
		syncExternalCli: false
	});
}
/** Removes all auth profiles and related state for a provider. */
async function removeProviderAuthProfilesWithLock(params) {
	const providerKey = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider);
	const storeOrderKey = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (store) => {
			const profileIds = require_profile_list.listProfilesForProvider(store, params.provider);
			let changed = false;
			for (const profileId of profileIds) {
				if (store.profiles[profileId]) {
					delete store.profiles[profileId];
					changed = true;
				}
				if (store.usageStats?.[profileId]) {
					delete store.usageStats[profileId];
					changed = true;
				}
			}
			if (store.order?.[storeOrderKey]) {
				delete store.order[storeOrderKey];
				changed = true;
				if (Object.keys(store.order).length === 0) store.order = void 0;
			}
			if (store.lastGood?.[providerKey]) {
				delete store.lastGood[providerKey];
				changed = true;
				if (Object.keys(store.lastGood).length === 0) store.lastGood = void 0;
			}
			if (store.usageStats && Object.keys(store.usageStats).length === 0) store.usageStats = void 0;
			return changed;
		}
	});
}
/** Removes selected auth profiles and every state pointer that references them. */
async function removeAuthProfilesWithLock(params) {
	const profileIds = new Set(require_profile_list.dedupeProfileIds([...params.profileIds]));
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (store) => {
			let changed = false;
			for (const profileId of profileIds) {
				if (store.profiles[profileId]) {
					delete store.profiles[profileId];
					changed = true;
				}
				if (store.usageStats?.[profileId]) {
					delete store.usageStats[profileId];
					changed = true;
				}
			}
			for (const [provider, order] of Object.entries(store.order ?? {})) {
				const next = order.filter((profileId) => !profileIds.has(profileId));
				if (next.length === order.length) continue;
				changed = true;
				if (next.length > 0) store.order[provider] = next;
				else delete store.order[provider];
			}
			for (const [provider, profileId] of Object.entries(store.lastGood ?? {})) if (profileIds.has(profileId)) {
				delete store.lastGood[provider];
				changed = true;
			}
			if (store.order && Object.keys(store.order).length === 0) store.order = void 0;
			if (store.lastGood && Object.keys(store.lastGood).length === 0) store.lastGood = void 0;
			if (store.usageStats && Object.keys(store.usageStats).length === 0) store.usageStats = void 0;
			return changed;
		}
	});
}
/** Clear the last-good profile pointer for a provider under the store lock. */
async function clearLastGoodProfileWithLock(params) {
	const providerKey = require_provider_auth_aliases.resolveProviderIdForAuth(params.provider);
	return await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (store) => {
			const lastGoodKey = findProviderAuthStateKey(store.lastGood, providerKey);
			if (!lastGoodKey || store.lastGood?.[lastGoodKey] !== params.profileId) return false;
			delete store.lastGood[lastGoodKey];
			if (Object.keys(store.lastGood).length === 0) store.lastGood = void 0;
			return true;
		}
	});
}
/** Mark a profile as successfully used and update ordering/usage metadata. */
async function markAuthProfileSuccess(params) {
	const { store, provider, profileId, agentDir } = params;
	const providerKey = require_provider_auth_aliases.resolveProviderIdForAuth(provider);
	const lastUsed = Date.now();
	const updated = await require_store.updateAuthProfileStoreWithLock({
		agentDir,
		updater: (freshStore) => {
			const profile = freshStore.profiles[profileId];
			if (!profile || require_provider_auth_aliases.resolveProviderIdForAuth(profile.provider) !== providerKey) return false;
			freshStore.lastGood = {
				...freshStore.lastGood,
				[providerKey]: profileId
			};
			updateSuccessfulUsageStatsEntry(freshStore, profileId, lastUsed);
			return true;
		}
	});
	if (updated) {
		store.lastGood = updated.lastGood;
		store.usageStats = updated.usageStats;
		return;
	}
	if (updated === null) authProfileProfilesLog.warn("dropped auth profile bookkeeping after locked store update failed", {
		event: "auth_profile_bookkeeping_dropped",
		kind: "success",
		profileId,
		tags: ["auth_profiles", "persistence"]
	});
}
//#endregion
Object.defineProperty(exports, "clearLastGoodProfileWithLock", {
	enumerable: true,
	get: function() {
		return clearLastGoodProfileWithLock;
	}
});
Object.defineProperty(exports, "markAuthProfileSuccess", {
	enumerable: true,
	get: function() {
		return markAuthProfileSuccess;
	}
});
Object.defineProperty(exports, "normalizeAuthProfileCredential", {
	enumerable: true,
	get: function() {
		return normalizeAuthProfileCredential;
	}
});
Object.defineProperty(exports, "promoteAuthProfileInOrder", {
	enumerable: true,
	get: function() {
		return promoteAuthProfileInOrder;
	}
});
Object.defineProperty(exports, "removeAuthProfilesWithLock", {
	enumerable: true,
	get: function() {
		return removeAuthProfilesWithLock;
	}
});
Object.defineProperty(exports, "removeProviderAuthProfilesWithLock", {
	enumerable: true,
	get: function() {
		return removeProviderAuthProfilesWithLock;
	}
});
Object.defineProperty(exports, "setAuthProfileOrder", {
	enumerable: true,
	get: function() {
		return setAuthProfileOrder;
	}
});
Object.defineProperty(exports, "upsertAuthProfile", {
	enumerable: true,
	get: function() {
		return upsertAuthProfile;
	}
});
Object.defineProperty(exports, "upsertAuthProfileWithLock", {
	enumerable: true,
	get: function() {
		return upsertAuthProfileWithLock;
	}
});
