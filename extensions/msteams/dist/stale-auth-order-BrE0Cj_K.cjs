const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_provider_auth_aliases = require("./provider-auth-aliases-B21BttFc.cjs");
const require_openclaw_agent_db = require("./openclaw-agent-db-CMNDs1oU.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_external_auth = require("./external-auth-CPpcflX7.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
const require_order = require("./order-BH9w-_fU.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/commands/doctor/shared/stale-auth-order.ts
const AUTH_PROFILE_MODES = /* @__PURE__ */ new Set([
	"api_key",
	"aws-sdk",
	"oauth",
	"token"
]);
const INVALID_SQLITE_STORE_WARNING = "- Skipped auth.order repair because a SQLite auth profile store is unreadable, unavailable, or contains invalid credentials; repair or re-import that agent's auth store, then rerun doctor.";
function isProfileIdList(value) {
	return Array.isArray(value) && value.every((profileId) => typeof profileId === "string");
}
function readValidConfiguredAuthOrder(cfg) {
	const order = cfg.auth?.order;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(order)) return;
	const result = {};
	for (const [provider, profileIds] of Object.entries(order)) {
		if (!isProfileIdList(profileIds)) return;
		result[provider] = profileIds;
	}
	return result;
}
function hasValidConfiguredAuthProfiles(cfg) {
	const profiles = cfg.auth?.profiles;
	if (profiles === void 0) return true;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(profiles) && Object.values(profiles).every((profile) => (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(profile) && typeof profile.provider === "string" && typeof profile.mode === "string" && AUTH_PROFILE_MODES.has(profile.mode));
}
function hasNonemptyConfiguredAuthOrder(cfg) {
	const order = readValidConfiguredAuthOrder(cfg);
	return Boolean(order && Object.values(order).some((profileIds) => profileIds.length > 0));
}
function inspectAuthPath(pathname) {
	try {
		node_fs.default.statSync(pathname);
		return "present";
	} catch (error) {
		if (error.code !== "ENOENT") return "unreadable";
	}
	try {
		node_fs.default.lstatSync(pathname);
		return "unreadable";
	} catch (error) {
		if (error.code !== "ENOENT") return "unreadable";
	}
	let ancestor = node_path.default.dirname(pathname);
	while (true) {
		try {
			const stat = node_fs.default.lstatSync(ancestor);
			if (!stat.isSymbolicLink()) return stat.isDirectory() ? "missing" : "unreadable";
			try {
				return node_fs.default.statSync(ancestor).isDirectory() ? "missing" : "unreadable";
			} catch {
				return "unreadable";
			}
		} catch (error) {
			if (error.code !== "ENOENT") return "unreadable";
		}
		const parent = node_path.default.dirname(ancestor);
		if (parent === ancestor) return "missing";
		ancestor = parent;
	}
}
function inspectUnmigratedAuthStoreSources(agentDir) {
	const results = new Set([
		require_path_resolve.resolveAuthStorePath(agentDir),
		require_path_resolve.resolveAuthStatePath(agentDir),
		require_path_resolve.resolveLegacyAuthStorePath(agentDir)
	].map((pathname) => inspectAuthPath(pathname)));
	if (results.has("unreadable")) return "unreadable";
	return results.has("present") ? "present" : "missing";
}
function inspectAuthDatabaseFiles(agentDir) {
	const [databasePath, ...sidecarPaths] = require_sqlite.resolveAuthProfileDatabaseFilePaths(agentDir);
	if (!databasePath) return "unreadable";
	const availability = inspectAuthPath(databasePath);
	const sidecarAvailability = sidecarPaths.map((pathname) => inspectAuthPath(pathname));
	if (availability === "unreadable" || sidecarAvailability.some((status) => status === "unreadable")) return "unreadable";
	if (availability === "present") return "present";
	return sidecarAvailability.every((sidecar) => sidecar === "missing") ? "missing" : "unreadable";
}
function loadCompletePersistedStore(agentDir) {
	const inspection = require_sqlite.inspectPersistedAuthProfileStoreRaw(agentDir);
	const stateInspection = require_sqlite.inspectPersistedAuthProfileStateRaw(agentDir);
	if (inspection.status === "unreadable" || stateInspection.status === "unreadable") return { status: "invalid" };
	const storeMissingReason = inspection.status === "missing" ? inspection.reason : void 0;
	const stateMissingReason = stateInspection.status === "missing" ? stateInspection.reason : void 0;
	if (storeMissingReason === "database" || stateMissingReason === "database") return storeMissingReason === "database" && stateMissingReason === "database" ? {
		status: "ok",
		store: null,
		hasAuthTables: false
	} : { status: "invalid" };
	if (storeMissingReason === "table" !== (stateMissingReason === "table")) return { status: "invalid" };
	if (storeMissingReason === "table") return {
		status: "ok",
		store: null,
		hasAuthTables: false
	};
	const persistedState = stateInspection.status === "readable" ? require_persisted.coerceAuthProfileState(stateInspection.raw) : {};
	if (inspection.status === "missing") return stateInspection.status === "missing" ? {
		status: "ok",
		store: null,
		hasAuthTables: true
	} : {
		status: "ok",
		store: {
			version: 1,
			profiles: {},
			...persistedState
		},
		hasAuthTables: true
	};
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(inspection.raw) || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(inspection.raw.profiles)) return { status: "invalid" };
	const store = require_persisted.coercePersistedAuthProfileStore(inspection.raw);
	const rawProfileIds = Object.keys(inspection.raw.profiles);
	if (!store || rawProfileIds.length !== Object.keys(store.profiles).length || rawProfileIds.some((profileId) => !Object.hasOwn(store.profiles, profileId))) return { status: "invalid" };
	return {
		status: "ok",
		store: {
			...store,
			...require_persisted.mergeAuthProfileState(require_persisted.coerceAuthProfileState(inspection.raw), persistedState)
		},
		hasAuthTables: true
	};
}
function listRetainedStateAgentDirs(env) {
	const agentsRoot = node_path.default.join(require_paths.resolveStateDir(env), "agents");
	let entries;
	try {
		entries = node_fs.default.readdirSync(agentsRoot, { withFileTypes: true });
	} catch (error) {
		const code = error.code;
		return code === "ENOENT" || code === "ENOTDIR" ? [] : null;
	}
	const agentDirs = [];
	for (const entry of entries) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
		const agentDir = node_path.default.join(agentsRoot, entry.name, "agent");
		try {
			if (node_fs.default.statSync(agentDir).isDirectory()) agentDirs.push(node_path.default.resolve(agentDir));
			else return null;
		} catch (error) {
			const code = error.code;
			if (entry.isSymbolicLink() || code !== "ENOENT" && code !== "ENOTDIR") return null;
			try {
				node_fs.default.lstatSync(agentDir);
				return null;
			} catch (lstatError) {
				const lstatCode = lstatError.code;
				if (lstatCode !== "ENOENT" && lstatCode !== "ENOTDIR") return null;
			}
		}
	}
	return agentDirs;
}
function loadConfiguredAgentAuthStores(cfg, env) {
	const order = readValidConfiguredAuthOrder(cfg);
	if (!order || !hasValidConfiguredAuthProfiles(cfg)) return;
	const mainAgentDir = node_path.default.resolve(require_agent_scope_config.resolveDefaultAgentDir({}, env));
	const activeAgentDirs = /* @__PURE__ */ new Set();
	const expectedAgentIdsByDir = /* @__PURE__ */ new Map();
	const addExpectedAgentDir = (agentDir, agentId) => {
		const owners = expectedAgentIdsByDir.get(agentDir) ?? /* @__PURE__ */ new Set();
		owners.add((0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(agentId));
		expectedAgentIdsByDir.set(agentDir, owners);
	};
	addExpectedAgentDir(mainAgentDir, require_session_key.DEFAULT_AGENT_ID);
	for (const agentId of require_agent_scope_config.listAgentIds(cfg)) {
		const agentDir = node_path.default.resolve(require_agent_scope_config.resolveAgentDir(cfg, agentId, env));
		activeAgentDirs.add(agentDir);
		addExpectedAgentDir(agentDir, agentId);
	}
	const envAgentDir = env.OPERATOR_AGENT_DIR?.trim() || env.PI_CODING_AGENT_DIR?.trim() || void 0;
	if (envAgentDir) {
		const agentDir = node_path.default.resolve(require_home_dir.resolveUserPath(envAgentDir, env));
		activeAgentDirs.add(agentDir);
		addExpectedAgentDir(agentDir, require_sqlite.resolveAuthProfileDatabaseOwnerId(agentDir));
	}
	const retainedAgentDirs = listRetainedStateAgentDirs(env);
	if (!retainedAgentDirs) return {
		status: "blocked",
		warnings: [INVALID_SQLITE_STORE_WARNING]
	};
	const agentDirs = /* @__PURE__ */ new Set([
		mainAgentDir,
		...activeAgentDirs,
		...retainedAgentDirs
	]);
	const entries = [];
	for (const agentDir of agentDirs) {
		const expectedAgentIds = expectedAgentIdsByDir.get(agentDir);
		if (expectedAgentIds && expectedAgentIds.size !== 1) return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		const legacyAvailability = inspectUnmigratedAuthStoreSources(agentDir);
		if (legacyAvailability === "unreadable") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		if (legacyAvailability === "present") return;
		const databasePath = node_path.default.resolve(require_sqlite.resolveAuthProfileDatabasePath(agentDir));
		const availability = inspectAuthDatabaseFiles(agentDir);
		if (availability === "unreadable") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		const owner = availability === "present" ? require_openclaw_agent_db.inspectOperatorAgentDatabaseOwner(databasePath) : void 0;
		if (owner) {
			if (owner.status === "unreadable" || expectedAgentIds && owner.status === "owned" && !expectedAgentIds.has(owner.agentId)) return {
				status: "blocked",
				warnings: [INVALID_SQLITE_STORE_WARNING]
			};
		}
		const loaded = loadCompletePersistedStore(agentDir);
		if (loaded.status === "invalid") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		if (owner?.status === "unowned" && loaded.hasAuthTables) return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		entries.push({
			agentDir,
			databasePath,
			store: loaded.store
		});
	}
	let registeredDatabases;
	try {
		const registryEntries = require_openclaw_agent_db.listOperatorRegisteredAgentDatabases({ env });
		if (registryEntries.some((entry) => !entry.path.trim() || !node_path.default.isAbsolute(entry.path))) return;
		const authDatabaseBasename = node_path.default.basename(require_sqlite.resolveAuthProfileDatabasePath(mainAgentDir));
		registeredDatabases = registryEntries.flatMap((entry) => node_path.default.basename(entry.path) === authDatabaseBasename ? [{
			agentId: entry.agentId,
			path: node_path.default.resolve(entry.path)
		}] : []);
	} catch {
		return;
	}
	const entriesByDatabasePath = new Map(entries.map((entry) => [entry.databasePath, entry]));
	const registeredEntries = [];
	const registeredOwnersByPath = /* @__PURE__ */ new Map();
	for (const entry of registeredDatabases) {
		const owners = registeredOwnersByPath.get(entry.path) ?? /* @__PURE__ */ new Set();
		owners.add(entry.agentId);
		registeredOwnersByPath.set(entry.path, owners);
	}
	for (const [databasePath, owners] of registeredOwnersByPath) {
		const agentDir = node_path.default.dirname(databasePath);
		if (node_path.default.resolve(require_sqlite.resolveAuthProfileDatabasePath(agentDir)) !== databasePath) continue;
		const legacyAvailability = inspectUnmigratedAuthStoreSources(agentDir);
		if (legacyAvailability === "unreadable") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		if (legacyAvailability === "present") return;
		const availability = inspectAuthDatabaseFiles(agentDir);
		if (availability === "missing") continue;
		if (availability === "unreadable") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		const owner = require_openclaw_agent_db.inspectOperatorAgentDatabaseOwner(databasePath);
		if (owner.status !== "owned" || !owners.has(owner.agentId)) return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		const loaded = loadCompletePersistedStore(agentDir);
		if (loaded.status === "invalid") return {
			status: "blocked",
			warnings: [INVALID_SQLITE_STORE_WARNING]
		};
		const knownEntry = entriesByDatabasePath.get(databasePath);
		if (knownEntry) {
			knownEntry.store = loaded.store;
			continue;
		}
		registeredEntries.push({
			agentDir,
			store: loaded.store
		});
	}
	const emptyStore = {
		version: 1,
		profiles: {}
	};
	const mainStore = entries.find((entry) => entry.agentDir === mainAgentDir)?.store ?? emptyStore;
	const agentStores = entries.map((entry) => {
		const localStore = entry.store ?? emptyStore;
		return entry.agentDir === mainAgentDir ? mainStore : require_persisted.mergeAuthProfileStores(mainStore, localStore, { preserveBaseRuntimeExternalProfiles: true });
	});
	const activeStores = entries.flatMap((entry, index) => activeAgentDirs.has(entry.agentDir) ? [agentStores[index] ?? emptyStore] : []);
	const stores = [...agentStores, ...registeredEntries.flatMap((entry) => entry.store ? [entry.store] : [])];
	const providerIds = Object.keys(order);
	const profileIds = Object.values(order).flat();
	const runtimeProfileIds = /* @__PURE__ */ new Set();
	const runtimeEntries = [...entries.map((entry, index) => ({
		agentDir: entry.agentDir,
		store: agentStores[index] ?? emptyStore
	})), ...registeredEntries.map((entry) => ({
		agentDir: entry.agentDir,
		store: require_persisted.mergeAuthProfileStores(mainStore, entry.store ?? emptyStore, { preserveBaseRuntimeExternalProfiles: true })
	}))];
	try {
		for (const entry of runtimeEntries) {
			const externalProfiles = require_external_auth.listRuntimeExternalAuthProfiles({
				store: entry.store,
				agentDir: entry.agentDir,
				env,
				externalCli: {
					allowKeychainPrompt: false,
					config: cfg,
					externalCliProviderIds: providerIds,
					externalCliProfileIds: profileIds
				}
			});
			for (const profile of externalProfiles) runtimeProfileIds.add(profile.profileId);
		}
	} catch {
		return;
	}
	return {
		status: "ready",
		stores,
		activeStores,
		runtimeProfileIds
	};
}
function removeAuthOrderKeys(cfg, providers) {
	const order = Object.fromEntries(Object.entries(readValidConfiguredAuthOrder(cfg) ?? {}).filter(([provider]) => !providers.has(provider)));
	return {
		...cfg,
		auth: {
			...cfg.auth,
			order
		}
	};
}
/** Find nonempty config orders that only reference removed profiles. */
function scanStaleConfiguredAuthOrders(params) {
	const order = readValidConfiguredAuthOrder(params.cfg);
	if (!order || !hasValidConfiguredAuthProfiles(params.cfg)) return [];
	const configuredProfileIds = new Set(Object.keys(params.cfg.auth?.profiles ?? {}));
	const storedProfileIds = new Set(params.stores.flatMap((store) => Object.keys(store.profiles)));
	const staleByCanonicalProvider = /* @__PURE__ */ new Map();
	for (const [provider, profileIds] of Object.entries(order)) {
		if (profileIds.length === 0 || profileIds.some((profileId) => configuredProfileIds.has(profileId) || storedProfileIds.has(profileId) || params.runtimeProfileIds?.has(profileId))) continue;
		const canonicalProvider = require_provider_auth_aliases.resolveProviderIdForAuth(provider, { config: params.cfg });
		const entries = staleByCanonicalProvider.get(canonicalProvider) ?? [];
		entries.push({
			provider,
			staleProfileCount: profileIds.length
		});
		staleByCanonicalProvider.set(canonicalProvider, entries);
	}
	const hits = [];
	for (const [canonicalProvider, staleEntries] of staleByCanonicalProvider) {
		const staleProviders = new Set(staleEntries.map((entry) => entry.provider));
		const cfgWithoutStaleOrder = removeAuthOrderKeys(params.cfg, staleProviders);
		const fallbackStores = params.activeStores ?? params.stores;
		if (fallbackStores.length > 0 && fallbackStores.every((store) => {
			const selectionStore = structuredClone(store);
			return require_order.resolveAuthProfileOrder({
				cfg: cfgWithoutStaleOrder,
				store: selectionStore,
				provider: canonicalProvider
			}).length > 0;
		})) hits.push(...staleEntries);
	}
	return hits;
}
/** Remove provably stale config orders and restore per-agent automatic selection. */
function repairStaleConfiguredAuthOrders(params) {
	const hits = scanStaleConfiguredAuthOrders(params);
	if (hits.length === 0) return {
		config: params.cfg,
		changes: []
	};
	return {
		config: removeAuthOrderKeys(params.cfg, new Set(hits.map((hit) => hit.provider))),
		changes: hits.map((hit) => `auth.order.${hit.provider}: removed ${hit.staleProfileCount} missing profile reference${hit.staleProfileCount === 1 ? "" : "s"} to restore automatic per-agent auth selection.`)
	};
}
/** Load configured agent stores and repair their stale config auth orders. */
function maybeRepairStaleConfiguredAuthOrders(params) {
	if (!hasNonemptyConfiguredAuthOrder(params.cfg)) return {
		config: params.cfg,
		changes: []
	};
	const loaded = loadConfiguredAgentAuthStores(params.cfg, params.env ?? process.env);
	if (!loaded) return {
		config: params.cfg,
		changes: []
	};
	if (loaded.status === "blocked") return {
		config: params.cfg,
		changes: [],
		warnings: loaded.warnings
	};
	return repairStaleConfiguredAuthOrders({
		cfg: params.cfg,
		...loaded
	});
}
/** Build preview warnings for stale config auth orders. */
function collectStaleConfiguredAuthOrderWarnings(params) {
	if (!hasNonemptyConfiguredAuthOrder(params.cfg)) return [];
	const loaded = loadConfiguredAgentAuthStores(params.cfg, params.env ?? process.env);
	if (!loaded) return [];
	if (loaded.status === "blocked") return loaded.warnings;
	return scanStaleConfiguredAuthOrders({
		cfg: params.cfg,
		...loaded
	}).map((hit) => `- auth.order.${hit.provider} references only missing profiles while compatible stored credentials exist; run ${params.doctorFixCommand} to remove the stale override and restore automatic selection.`);
}
if (process.env.VITEST || false) globalThis[Symbol.for("operator.staleAuthOrderTestApi")] = { repairStaleConfiguredAuthOrders };
//#endregion
exports.collectStaleConfiguredAuthOrderWarnings = collectStaleConfiguredAuthOrderWarnings;
exports.maybeRepairStaleConfiguredAuthOrders = maybeRepairStaleConfiguredAuthOrders;
