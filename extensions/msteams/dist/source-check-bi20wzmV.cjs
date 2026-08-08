const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_credential_state = require("./credential-state-C5phrsSu.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
const require_runtime_snapshots = require("./runtime-snapshots-CaeNMYa4.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
//#region src/agents/auth-profiles/source-check.ts
/**
* Auth-profile source probes for runtime and persisted stores.
* These checks intentionally avoid loading secret-bearing credential payloads.
*/
function hasStoredAuthProfileFiles(agentDir) {
	return node_fs.default.existsSync(require_path_resolve.resolveAuthStorePath(agentDir)) || node_fs.default.existsSync(require_path_resolve.resolveAuthStatePath(agentDir)) || node_fs.default.existsSync(require_path_resolve.resolveLegacyAuthStorePath(agentDir));
}
function readJsonFile(pathname) {
	try {
		return JSON.parse(node_fs.default.readFileSync(pathname, "utf8"));
	} catch {
		return null;
	}
}
function normalizeProvider(provider) {
	return provider.trim().toLowerCase();
}
function isAuthProfileCredential(value) {
	if (!value || typeof value !== "object") return false;
	const credential = value;
	const type = credential.type;
	return typeof credential.provider === "string" && (type === "api_key" || type === "token" || type === "oauth");
}
function isEligibleProviderCredential(rawCredential, expectedProvider) {
	if (!isAuthProfileCredential(rawCredential)) return false;
	return normalizeProvider(rawCredential.provider) === expectedProvider && require_credential_state.evaluateStoredCredentialEligibility({ credential: rawCredential }).eligible;
}
function coerceRawStoreProfiles(raw) {
	return require_persisted.coercePersistedAuthProfileStore(raw)?.profiles ?? require_persisted.coerceLegacyAuthStore(raw);
}
function rawStoreHasProviderProfile(raw, provider, profileIds) {
	const profiles = coerceRawStoreProfiles(raw);
	if (!profiles) return false;
	const expected = normalizeProvider(provider);
	const credentials = profileIds?.map((profileId) => profiles[profileId]) ?? Object.values(profiles);
	for (const rawCredential of credentials) if (isEligibleProviderCredential(rawCredential, expected)) return true;
	return false;
}
function runtimeStoreHasProviderProfile(store, provider, profileIds) {
	return rawStoreHasProviderProfile(store, provider, profileIds);
}
/** Returns true when any local/runtime/main auth profile source exists. */
function hasAnyAuthProfileStoreSource(agentDir) {
	if (hasLocalAuthProfileStoreSource(agentDir)) return true;
	if (require_runtime_snapshots.hasAnyRuntimeAuthProfileStoreSource(agentDir)) return true;
	const authPath = require_path_resolve.resolveAuthStorePath(agentDir);
	const mainAuthPath = require_path_resolve.resolveAuthStorePath();
	if (agentDir && authPath !== mainAuthPath && (hasStoredAuthProfileFiles(void 0) || require_sqlite.readPersistedAuthProfileStoreRaw(void 0) || require_sqlite.readPersistedAuthProfileStateRaw(void 0))) return true;
	return false;
}
/** Returns true when the requested agent dir has a local auth profile source. */
function hasLocalAuthProfileStoreSource(agentDir) {
	const runtimeStore = require_runtime_snapshots.getRuntimeAuthProfileStoreSnapshot(agentDir);
	if (runtimeStore && Object.keys(runtimeStore.profiles).length > 0) return true;
	if (hasStoredAuthProfileFiles(agentDir)) return true;
	return Boolean(require_sqlite.readPersistedAuthProfileStoreRaw(agentDir) || require_sqlite.readPersistedAuthProfileStateRaw(agentDir));
}
/** Returns true when a read-only auth-profile source contains a profile for a provider. */
function hasAuthProfileStoreSourceForProvider(provider, agentDir, options) {
	if (!normalizeProvider(provider)) return false;
	const profileIds = options?.profileIds;
	if (profileIds?.length === 0) return false;
	if (runtimeStoreHasProviderProfile(require_runtime_snapshots.getRuntimeAuthProfileStoreSnapshot(agentDir), provider, profileIds)) return true;
	if (rawStoreHasProviderProfile(readJsonFile(require_path_resolve.resolveAuthStorePath(agentDir)), provider, profileIds)) return true;
	if (rawStoreHasProviderProfile(readJsonFile(require_path_resolve.resolveLegacyAuthStorePath(agentDir)), provider, profileIds)) return true;
	if (rawStoreHasProviderProfile(require_sqlite.readPersistedAuthProfileStoreRaw(agentDir), provider, profileIds)) return true;
	if (!agentDir) return false;
	if (runtimeStoreHasProviderProfile(require_runtime_snapshots.getRuntimeAuthProfileStoreSnapshot(), provider, profileIds)) return true;
	if (rawStoreHasProviderProfile(readJsonFile(require_path_resolve.resolveAuthStorePath()), provider, profileIds)) return true;
	if (rawStoreHasProviderProfile(readJsonFile(require_path_resolve.resolveLegacyAuthStorePath()), provider, profileIds)) return true;
	return rawStoreHasProviderProfile(require_sqlite.readPersistedAuthProfileStoreRaw(), provider, profileIds);
}
//#endregion
Object.defineProperty(exports, "hasAnyAuthProfileStoreSource", {
	enumerable: true,
	get: function() {
		return hasAnyAuthProfileStoreSource;
	}
});
Object.defineProperty(exports, "hasAuthProfileStoreSourceForProvider", {
	enumerable: true,
	get: function() {
		return hasAuthProfileStoreSourceForProvider;
	}
});
Object.defineProperty(exports, "hasLocalAuthProfileStoreSource", {
	enumerable: true,
	get: function() {
		return hasLocalAuthProfileStoreSource;
	}
});
