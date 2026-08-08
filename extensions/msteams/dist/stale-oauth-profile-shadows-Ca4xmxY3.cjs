const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_persisted = require("./persisted-BWJt7718.cjs");
const require_path_resolve = require("./path-resolve-BdO8BFFi.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/commands/doctor/shared/stale-oauth-profile-shadows.ts
async function loadRawAuthProfileStore(authPath) {
	try {
		const raw = JSON.parse(await node_fs_promises.default.readFile(authPath, "utf8"));
		return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw) ? raw : null;
	} catch {
		return null;
	}
}
function hasLegacyOAuthSidecarRef(raw, profileId) {
	if (!raw || !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(raw.profiles)) return false;
	const profile = raw.profiles[profileId];
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(profile)) return false;
	return profile.type === "oauth" && profile.provider === "openai-codex" && require_persisted.isLegacyOAuthRef(profile.oauthRef);
}
async function collectStateAgentDirs(env) {
	const agentsRoot = node_path.default.join(require_paths.resolveStateDir(env), "agents");
	return (await node_fs_promises.default.readdir(agentsRoot, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => node_path.default.join(agentsRoot, entry.name, "agent"));
}
async function collectCandidateAgentDirs(cfg, env) {
	const dirs = /* @__PURE__ */ new Set();
	for (const entry of require_agent_scope_config.listAgentEntries(cfg)) {
		const id = entry.id?.trim();
		if (id) dirs.add(node_path.default.resolve(require_agent_scope_config.resolveAgentDir(cfg, id, env)));
	}
	for (const agentDir of await collectStateAgentDirs(env)) dirs.add(node_path.default.resolve(agentDir));
	return [...dirs].toSorted((left, right) => left.localeCompare(right));
}
function shouldRemoveLocalOAuthShadow(params) {
	const { local, main, now } = params;
	if (main?.type !== "oauth" || local.provider !== main.provider) return false;
	if (!require_persisted.isSafeToAdoptMainStoreOAuthIdentity(local, main)) return false;
	if (require_persisted.areOAuthCredentialsEquivalent(local, main)) return true;
	if (!require_persisted.hasUsableOAuthCredential(main, now)) return false;
	if (!require_persisted.hasUsableOAuthCredential(local, now)) return true;
	const localExpires = Number.isFinite(local.expires) ? local.expires : 0;
	return (Number.isFinite(main.expires) ? main.expires : 0) >= localExpires;
}
/** Find local OAuth profiles that safely inherit fresher main-agent credentials instead. */
async function scanStaleOAuthProfileShadows(params) {
	const env = params.env ?? process.env;
	const now = params.now ?? Date.now();
	const mainAgentDir = require_agent_scope_config.resolveDefaultAgentDir({}, env);
	const mainAuthPath = node_path.default.resolve(require_path_resolve.resolveAuthStorePath(mainAgentDir));
	const mainStore = require_persisted.loadPersistedAuthProfileStore(mainAgentDir);
	if (!mainStore) return [];
	const hits = [];
	for (const agentDir of await collectCandidateAgentDirs(params.cfg, env)) {
		const authPath = node_path.default.resolve(require_path_resolve.resolveAuthStorePath(agentDir));
		if (authPath === mainAuthPath) continue;
		const rawLocalStore = await loadRawAuthProfileStore(authPath);
		const localStore = require_persisted.loadPersistedAuthProfileStore(agentDir);
		if (!localStore) continue;
		for (const [profileId, local] of Object.entries(localStore.profiles)) {
			if (local.type !== "oauth") continue;
			if (hasLegacyOAuthSidecarRef(rawLocalStore, profileId)) continue;
			const main = mainStore.profiles[profileId];
			if (shouldRemoveLocalOAuthShadow({
				local,
				main: main?.type === "oauth" ? main : void 0,
				now
			})) hits.push({
				agentDir,
				authPath,
				profileId
			});
		}
	}
	return hits;
}
function removeStaleProfilesFromStore(params) {
	const removedProfileIds = [];
	const profiles = { ...params.store.profiles };
	const usageStats = params.store.usageStats ? { ...params.store.usageStats } : void 0;
	const order = params.store.order ? { ...params.store.order } : void 0;
	const lastGood = params.store.lastGood ? { ...params.store.lastGood } : void 0;
	for (const profileId of params.profileIds) {
		const local = profiles[profileId];
		const main = params.mainStore.profiles[profileId];
		if (local?.type !== "oauth" || !shouldRemoveLocalOAuthShadow({
			local,
			main: main?.type === "oauth" ? main : void 0,
			now: params.now
		})) continue;
		delete profiles[profileId];
		if (usageStats) delete usageStats[profileId];
		if (lastGood) {
			for (const [provider, lastGoodProfileId] of Object.entries(lastGood)) if (lastGoodProfileId === profileId) delete lastGood[provider];
		}
		if (order) for (const [provider, profileIds] of Object.entries(order)) {
			const nextProfileIds = profileIds.filter((entry) => entry !== profileId);
			if (nextProfileIds.length > 0) order[provider] = nextProfileIds;
			else delete order[provider];
		}
		removedProfileIds.push(profileId);
	}
	return {
		store: {
			...params.store,
			profiles,
			...usageStats && Object.keys(usageStats).length > 0 ? { usageStats } : { usageStats: void 0 },
			...lastGood && Object.keys(lastGood).length > 0 ? { lastGood } : { lastGood: void 0 },
			...order && Object.keys(order).length > 0 ? { order } : { order: void 0 }
		},
		removedProfileIds
	};
}
function formatProfileList(profileIds) {
	return profileIds.length === 1 ? (0, _gabrielvfonseca_normalization_core.expectDefined)(profileIds[0], "profile ids entry at 0") : `${profileIds.length} profiles`;
}
async function repairStaleOAuthProfilesForAgent(params) {
	const rawStore = await loadRawAuthProfileStore(require_path_resolve.resolveAuthStorePath(params.agentDir));
	const profileIds = new Set([...params.profileIds].filter((profileId) => !hasLegacyOAuthSidecarRef(rawStore, profileId)));
	if (profileIds.size === 0) return { status: "unchanged" };
	if (!require_persisted.loadPersistedAuthProfileStore(params.agentDir)) return { status: "missing" };
	let sawStore = false;
	let removedProfileIds = [];
	await require_store.updateAuthProfileStoreWithLock({
		agentDir: params.agentDir,
		updater: (store) => {
			sawStore = true;
			const result = removeStaleProfilesFromStore({
				store,
				mainStore: params.mainStore,
				profileIds,
				now: params.now
			});
			if (result.removedProfileIds.length === 0) return false;
			removedProfileIds = result.removedProfileIds;
			Object.assign(store, result.store);
			return true;
		}
	});
	if (!sawStore) return { status: "missing" };
	return removedProfileIds.length > 0 ? {
		status: "changed",
		removedProfileIds
	} : { status: "unchanged" };
}
/** Format warnings for stale per-agent OAuth profile shadows. */
function collectStaleOAuthProfileShadowWarnings(params) {
	return params.hits.map((hit) => `- ${require_utils.shortenHomePath(hit.authPath)} has stale OAuth auth profile ${hit.profileId}; it shadows the fresher main-agent credential. Run "${params.doctorFixCommand}" to remove the local shadow and inherit main auth.`);
}
/** Remove stale per-agent OAuth profile shadows after rechecking each locked store. */
async function repairStaleOAuthProfileShadows(params) {
	const env = params.env ?? process.env;
	const now = params.now ?? Date.now();
	const hits = await scanStaleOAuthProfileShadows({
		...params,
		env,
		now
	});
	const changes = [];
	const warnings = [];
	const byAgentDir = /* @__PURE__ */ new Map();
	for (const hit of hits) {
		const existing = byAgentDir.get(hit.agentDir) ?? [];
		existing.push(hit);
		byAgentDir.set(hit.agentDir, existing);
	}
	for (const [agentDir, agentHits] of byAgentDir) {
		const mainStore = require_persisted.loadPersistedAuthProfileStore(require_agent_scope_config.resolveDefaultAgentDir({}, env));
		if (!mainStore) continue;
		const profileIds = new Set(agentHits.map((hit) => hit.profileId));
		try {
			const repair = await repairStaleOAuthProfilesForAgent({
				agentDir,
				mainStore,
				profileIds,
				now
			});
			if (repair.status === "changed") changes.push(`Removed stale OAuth auth profile shadow ${formatProfileList(repair.removedProfileIds.toSorted())} from ${require_utils.shortenHomePath(require_path_resolve.resolveAuthStorePath(agentDir))}; this agent now inherits main auth.`);
		} catch (error) {
			warnings.push(`Failed to remove stale OAuth auth profile shadow from ${require_utils.shortenHomePath(require_path_resolve.resolveAuthStorePath(agentDir))}: ${String(error)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
const testing = {
	removeStaleProfilesFromStore,
	repairStaleOAuthProfilesForAgent
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.staleOAuthProfileShadowsTestApi")] = testing;
//#endregion
exports.collectStaleOAuthProfileShadowWarnings = collectStaleOAuthProfileShadowWarnings;
exports.repairStaleOAuthProfileShadows = repairStaleOAuthProfileShadows;
exports.scanStaleOAuthProfileShadows = scanStaleOAuthProfileShadows;
