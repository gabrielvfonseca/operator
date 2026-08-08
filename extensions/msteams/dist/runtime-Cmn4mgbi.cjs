require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_types_secrets = require("./types.secrets-2BFwbY6H.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_lazy_runtime = require("./lazy-runtime-DALacTZz.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_runtime_snapshots = require("./runtime-snapshots-CaeNMYa4.cjs");
const require_store = require("./store-BgTrp0qP.cjs");
require("./auth-profiles-DQeiAyJi.cjs");
const require_runtime_web_tools_state = require("./runtime-web-tools-state-DbJISCDm.cjs");
const require_runtime_state = require("./runtime-state-kSoytkKT.cjs");
const require_runtime_fast_path = require("./runtime-fast-path-CWKcJ0kW.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_util = require("node:util");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/secrets/runtime.ts
/** Prepares secrets runtime snapshots from config, auth stores, plugins, and env. */
require_runtime_state.registerSecretsRuntimeStateClearHook(require_store.clearRuntimeAuthProfileStoreSnapshots);
const loadRuntimeManifestHelpers = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./runtime-manifest.runtime-BDS71pRh.cjs")));
const loadRuntimePrepareHelpers = require_lazy_runtime.createLazyRuntimeModule(() => Promise.resolve().then(() => require("./runtime-prepare.runtime-C81pfTWs.cjs")));
async function resolveLoadablePluginOrigins(params) {
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(params.config, require_agent_scope_config.resolveDefaultAgentId(params.config));
	const { listPluginOriginsFromMetadataSnapshot, loadPluginMetadataSnapshot } = await loadRuntimeManifestHelpers();
	return listPluginOriginsFromMetadataSnapshot(params.pluginMetadataSnapshot ?? loadPluginMetadataSnapshot({
		config: params.config,
		workspaceDir,
		env: params.env
	}));
}
function hasConfiguredPluginEntries(config) {
	const entries = config.plugins?.entries;
	return Boolean(entries) && typeof entries === "object" && !Array.isArray(entries) && Object.keys(entries).length > 0;
}
function hasConfiguredChannelEntries(config) {
	const channels = config.channels;
	return Boolean(channels) && typeof channels === "object" && !Array.isArray(channels) && Object.keys(channels).some((channelId) => channelId !== "defaults");
}
function hasConfiguredPluginIntegrationSecretProviders(config) {
	const providers = config.secrets?.providers;
	if (!providers || typeof providers !== "object" || Array.isArray(providers)) return false;
	return Object.values(providers).some((provider) => provider?.source === "exec" && "pluginIntegration" in provider && provider.pluginIntegration !== void 0);
}
function shouldLoadPluginMetadataForSecrets(config) {
	return hasConfiguredPluginEntries(config) || hasConfiguredChannelEntries(config) || hasConfiguredPluginIntegrationSecretProviders(config);
}
/** Prepares a secrets runtime snapshot and records refresh context for later activation. */
async function prepareSecretsRuntimeSnapshot(params) {
	const runtimeEnv = require_runtime_fast_path.mergeSecretsRuntimeEnv(params.env);
	const authStoreCredentialsRevision = require_runtime_snapshots.getRuntimeAuthProfileStoreCredentialsRevision();
	const sourceConfig = structuredClone(params.config);
	const assignmentSourceConfig = structuredClone(params.assignmentConfig ?? params.config);
	const resolvedConfig = structuredClone(assignmentSourceConfig);
	const includeAuthStoreRefs = params.includeAuthStoreRefs ?? true;
	let authStores = [];
	const fastPathLoadAuthStore = params.loadAuthStore ?? require_store.loadAuthProfileStoreWithoutExternalProfiles;
	const candidateDirs = params.agentDirs?.length ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(params.agentDirs.map((entry) => require_home_dir.resolveUserPath(entry, runtimeEnv))) : require_runtime_fast_path.collectCandidateAgentDirs(resolvedConfig, runtimeEnv);
	if (includeAuthStoreRefs) for (const agentDir of candidateDirs) authStores.push({
		agentDir,
		store: structuredClone(fastPathLoadAuthStore(agentDir))
	});
	if (require_runtime_fast_path.canUseSecretsRuntimeFastPath({
		sourceConfig: assignmentSourceConfig,
		authStores
	})) {
		const manifestRegistry = params.manifestRegistry ?? params.pluginMetadataSnapshot?.manifestRegistry;
		const snapshot = {
			sourceConfig,
			config: resolvedConfig,
			authStores,
			authStoreCredentialsRevision,
			warnings: [],
			webTools: require_runtime_fast_path.createEmptyRuntimeWebToolsMetadata()
		};
		require_runtime_state.setPreparedSecretsRuntimeSnapshotRefreshContext(snapshot, {
			env: runtimeEnv,
			explicitAgentDirs: params.agentDirs?.length ? [...candidateDirs] : null,
			includeAuthStoreRefs,
			loadAuthStore: fastPathLoadAuthStore,
			loadablePluginOrigins: params.loadablePluginOrigins ?? /* @__PURE__ */ new Map(),
			...manifestRegistry ? { manifestRegistry } : {}
		});
		return snapshot;
	}
	const { applyResolvedAssignments, collectAuthStoreAssignments, collectConfigAssignments, createResolverContext, resolveRuntimeWebTools, resolveSecretRefValues } = await loadRuntimePrepareHelpers();
	const manifestRegistry = params.manifestRegistry ?? params.pluginMetadataSnapshot?.manifestRegistry;
	const loadablePluginOrigins = params.loadablePluginOrigins ?? (shouldLoadPluginMetadataForSecrets(sourceConfig) ? await resolveLoadablePluginOrigins({
		config: sourceConfig,
		env: runtimeEnv,
		pluginMetadataSnapshot: params.pluginMetadataSnapshot ?? (manifestRegistry ? { plugins: manifestRegistry.plugins } : void 0)
	}) : /* @__PURE__ */ new Map());
	const context = createResolverContext({
		sourceConfig,
		env: runtimeEnv,
		...manifestRegistry ? { manifestRegistry } : {}
	});
	collectConfigAssignments({
		config: resolvedConfig,
		context,
		loadablePluginOrigins
	});
	if (includeAuthStoreRefs) {
		const loadAuthStore = params.loadAuthStore ?? require_store.loadAuthProfileStoreForSecretsRuntime;
		if (!params.loadAuthStore) authStores = candidateDirs.map((agentDir) => ({
			agentDir,
			store: structuredClone(loadAuthStore(agentDir))
		}));
		for (const entry of authStores) collectAuthStoreAssignments({
			store: entry.store,
			context,
			agentDir: entry.agentDir
		});
	}
	if (context.assignments.length > 0) {
		const resolved = await resolveSecretRefValues(context.assignments.map((assignment) => assignment.ref), {
			config: sourceConfig,
			env: context.env,
			cache: context.cache,
			manifestRegistry: context.manifestRegistry
		});
		for (const value of resolved.values()) if (typeof value === "string") require_redact.registerSecretValueForRedaction(value);
		applyResolvedAssignments({
			assignments: context.assignments,
			resolved
		});
	}
	const snapshot = {
		sourceConfig,
		config: resolvedConfig,
		authStores,
		authStoreCredentialsRevision,
		warnings: context.warnings,
		webTools: await resolveRuntimeWebTools({
			sourceConfig,
			resolvedConfig,
			context
		})
	};
	require_runtime_state.setPreparedSecretsRuntimeSnapshotRefreshContext(snapshot, {
		env: runtimeEnv,
		explicitAgentDirs: params.agentDirs?.length ? [...candidateDirs] : null,
		includeAuthStoreRefs,
		loadAuthStore: params.loadAuthStore ?? require_store.loadAuthProfileStoreForSecretsRuntime,
		loadablePluginOrigins,
		...manifestRegistry ? { manifestRegistry } : {}
	});
	return snapshot;
}
/** Activates a prepared secrets runtime snapshot for fast runtime lookup. */
function activateSecretsRuntimeSnapshot(snapshot) {
	require_runtime_state.activateSecretsRuntimeSnapshotState(createSecretsRuntimeSnapshotActivation(snapshot));
}
/** Compare-and-activate boundary for snapshots prepared from process-wide runtime state. */
function activateSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, options) {
	return require_runtime_state.activateSecretsRuntimeSnapshotStateIfCurrent({
		...createSecretsRuntimeSnapshotActivation(snapshot),
		expectedRevision,
		preserveActivationLineage: options?.preserveActivationLineage
	});
}
/** Restores an owned predecessor while retaining changes after candidate preparation. */
function restoreSecretsRuntimeSnapshotIfCurrent(snapshot, expectedRevision, ownedSnapshot) {
	return require_runtime_state.restoreSecretsRuntimeSnapshotStateIfCurrent({
		...createSecretsRuntimeSnapshotActivation(snapshot),
		expectedRevision,
		ownedSnapshot
	});
}
function coercePreflightRefresh(value, sourceConfig) {
	if (!value || typeof value !== "object") return null;
	const candidate = value;
	return candidate.snapshot && typeof candidate.expectedRevision === "number" && (0, node_util.isDeepStrictEqual)(candidate.snapshot.sourceConfig, sourceConfig) ? candidate : null;
}
async function prepareActiveSecretsRuntimeRefresh(sourceConfig, includeAuthStoreRefs, snapshotConfig = sourceConfig) {
	const expectedRevision = require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
	const activeRefreshContext = require_runtime_state.getActiveSecretsRuntimeRefreshContext();
	if (!require_runtime_state.getActiveSecretsRuntimeSnapshot() || !activeRefreshContext) return null;
	return {
		snapshot: await prepareSecretsRuntimeSnapshot({
			config: sourceConfig,
			assignmentConfig: snapshotConfig,
			env: activeRefreshContext.env,
			agentDirs: require_runtime_fast_path.resolveRefreshAgentDirs(sourceConfig, activeRefreshContext),
			includeAuthStoreRefs: includeAuthStoreRefs ?? activeRefreshContext.includeAuthStoreRefs,
			loadablePluginOrigins: activeRefreshContext.loadablePluginOrigins,
			...activeRefreshContext.manifestRegistry ? { manifestRegistry: activeRefreshContext.manifestRegistry } : {},
			...activeRefreshContext.loadAuthStore ? { loadAuthStore: activeRefreshContext.loadAuthStore } : {}
		}),
		expectedRevision
	};
}
/** Prepares a config-write refresh candidate tied to the current runtime revision. */
async function preflightActiveSecretsRuntimeSnapshotRefresh(params) {
	return await prepareActiveSecretsRuntimeRefresh(params.sourceConfig, params.includeAuthStoreRefs);
}
/** Publishes a config-write refresh after retrying any candidate invalidated while preparing. */
async function refreshActiveSecretsRuntimeSnapshotForConfig(params) {
	let candidate = coercePreflightRefresh(params.preflightResult, params.sourceConfig);
	for (;;) {
		candidate ??= await prepareActiveSecretsRuntimeRefresh(params.sourceConfig, params.includeAuthStoreRefs);
		if (!candidate) return false;
		const activeRefreshContext = require_runtime_state.getActiveSecretsRuntimeRefreshContext();
		if (!activeRefreshContext) return false;
		if (params.includeAuthStoreRefs === false && activeRefreshContext.includeAuthStoreRefs) {
			candidate.snapshot.authStores = require_runtime_state.getLiveSecretsRuntimeAuthStores();
			candidate.snapshot.authStoreCredentialsRevision = require_runtime_snapshots.getRuntimeAuthProfileStoreCredentialsRevision();
			require_runtime_state.setPreparedSecretsRuntimeSnapshotRefreshContext(candidate.snapshot, activeRefreshContext);
		}
		if (activateSecretsRuntimeSnapshotIfCurrent(candidate.snapshot, candidate.expectedRevision)) return true;
		candidate = null;
	}
}
function patchResolvedSecretRefLeaves(params) {
	if (require_types_secrets.coerceSecretRef(params.source, params.defaults)) return (0, node_util.isDeepStrictEqual)(params.source, params.resolved) ? {
		changed: false,
		value: params.current
	} : {
		changed: true,
		value: params.resolved
	};
	if (Array.isArray(params.source) && Array.isArray(params.resolved)) {
		const next = Array.isArray(params.current) ? [...params.current] : structuredClone(params.resolved);
		let changed = false;
		for (const [index, source] of params.source.entries()) {
			const patch = patchResolvedSecretRefLeaves({
				current: next[index],
				source,
				resolved: params.resolved[index],
				defaults: params.defaults
			});
			if (patch.changed) {
				next[index] = patch.value;
				changed = true;
			}
		}
		return {
			changed,
			value: changed ? next : params.current
		};
	}
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.source) && (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.resolved)) {
		const next = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.current) ? { ...params.current } : structuredClone(params.resolved);
		let changed = false;
		for (const [key, source] of Object.entries(params.source)) {
			const patch = patchResolvedSecretRefLeaves({
				current: next[key],
				source,
				resolved: params.resolved[key],
				defaults: params.defaults
			});
			if (patch.changed) {
				next[key] = patch.value;
				changed = true;
			}
		}
		return {
			changed,
			value: changed ? next : params.current
		};
	}
	return {
		changed: false,
		value: params.current
	};
}
function selectProviderAuthConfig(config) {
	return {
		...config.secrets === void 0 ? {} : { secrets: config.secrets },
		...config.models === void 0 ? {} : { models: config.models }
	};
}
function createSecretsRuntimeSnapshotActivation(snapshot) {
	return {
		snapshot,
		refreshContext: require_runtime_state.getPreparedSecretsRuntimeSnapshotRefreshContext(snapshot) ?? require_runtime_state.getActiveSecretsRuntimeRefreshContext() ?? {
			env: { ...process.env },
			explicitAgentDirs: null,
			includeAuthStoreRefs: snapshot.authStores.length > 0,
			loadAuthStore: require_store.loadAuthProfileStoreForSecretsRuntime,
			loadablePluginOrigins: /* @__PURE__ */ new Map()
		},
		refreshHandler: {
			preflight: preflightActiveSecretsRuntimeSnapshotRefresh,
			refresh: refreshActiveSecretsRuntimeSnapshotForConfig
		}
	};
}
/** Refresh provider credentials without republishing transport-owned config. */
async function refreshActiveProviderAuthRuntimeSnapshot() {
	for (;;) {
		const activeSnapshot = require_runtime_state.getActiveSecretsRuntimeSnapshot();
		if (!activeSnapshot) return false;
		const providerAuthConfig = selectProviderAuthConfig(activeSnapshot.sourceConfig);
		const candidate = await prepareActiveSecretsRuntimeRefresh(activeSnapshot.sourceConfig, void 0, providerAuthConfig);
		if (!candidate) return false;
		const runtimeConfig = require_runtime_snapshot.getRuntimeConfigSnapshot();
		if (!runtimeConfig) return false;
		const config = { ...runtimeConfig };
		const modelsPatch = patchResolvedSecretRefLeaves({
			current: runtimeConfig.models,
			source: providerAuthConfig.models,
			resolved: candidate.snapshot.config.models,
			defaults: activeSnapshot.sourceConfig.secrets?.defaults
		});
		if (modelsPatch.changed) config.models = modelsPatch.value;
		if (activateSecretsRuntimeSnapshotIfCurrent({
			...activeSnapshot,
			config,
			authStores: candidate.snapshot.authStores,
			authStoreCredentialsRevision: candidate.snapshot.authStoreCredentialsRevision
		}, candidate.expectedRevision, { preserveActivationLineage: true })) return true;
	}
}
function getActiveSecretsRuntimeSnapshot() {
	return require_runtime_state.getActiveSecretsRuntimeSnapshot();
}
function getActiveSecretsRuntimeSnapshotRevision() {
	return require_runtime_state.getActiveSecretsRuntimeSnapshotRevision();
}
function getActiveSecretsRuntimeEnv() {
	return require_runtime_state.getActiveSecretsRuntimeEnv();
}
function getActiveRuntimeWebToolsMetadata() {
	return require_runtime_web_tools_state.getActiveRuntimeWebToolsMetadata();
}
function clearSecretsRuntimeSnapshot() {
	require_runtime_state.clearSecretsRuntimeSnapshot();
}
//#endregion
exports.activateSecretsRuntimeSnapshot = activateSecretsRuntimeSnapshot;
exports.activateSecretsRuntimeSnapshotIfCurrent = activateSecretsRuntimeSnapshotIfCurrent;
exports.clearSecretsRuntimeSnapshot = clearSecretsRuntimeSnapshot;
exports.getActiveRuntimeWebToolsMetadata = getActiveRuntimeWebToolsMetadata;
exports.getActiveSecretsRuntimeEnv = getActiveSecretsRuntimeEnv;
exports.getActiveSecretsRuntimeSnapshot = getActiveSecretsRuntimeSnapshot;
exports.getActiveSecretsRuntimeSnapshotRevision = getActiveSecretsRuntimeSnapshotRevision;
exports.preflightActiveSecretsRuntimeSnapshotRefresh = preflightActiveSecretsRuntimeSnapshotRefresh;
exports.prepareSecretsRuntimeSnapshot = prepareSecretsRuntimeSnapshot;
exports.refreshActiveProviderAuthRuntimeSnapshot = refreshActiveProviderAuthRuntimeSnapshot;
exports.refreshActiveSecretsRuntimeSnapshotForConfig = refreshActiveSecretsRuntimeSnapshotForConfig;
exports.restoreSecretsRuntimeSnapshotIfCurrent = restoreSecretsRuntimeSnapshotIfCurrent;
