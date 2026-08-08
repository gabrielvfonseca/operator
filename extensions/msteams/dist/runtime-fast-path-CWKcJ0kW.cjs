const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./path-resolve-BdO8BFFi.cjs");
const require_sqlite = require("./sqlite-CKOduXJ-.cjs");
const require_runtime_snapshots = require("./runtime-snapshots-CaeNMYa4.cjs");
const require_runtime_secret_scan = require("./runtime-secret-scan-B5-7QG0T.cjs");
let node_fs = require("node:fs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/secrets/runtime-fast-path.ts
/** Detects when secrets runtime preparation can safely use a fast path. */
const RUNTIME_PATH_ENV_KEYS = [
	"HOME",
	"USERPROFILE",
	"HOMEDRIVE",
	"HOMEPATH",
	"OPERATOR_HOME",
	"OPERATOR_STATE_DIR",
	"OPERATOR_CONFIG_PATH",
	"OPERATOR_AGENT_DIR",
	"OPERATOR_TEST_FAST"
];
/**
* Merges caller env with process path env needed for config and agent-dir resolution.
*/
function mergeSecretsRuntimeEnv(env) {
	const merged = { ...env ?? process.env };
	for (const key of RUNTIME_PATH_ENV_KEYS) {
		if (merged[key] !== void 0) continue;
		const processValue = process.env[key];
		if (processValue !== void 0) merged[key] = processValue;
	}
	return merged;
}
/**
* Collects default and named agent directories that may contain auth profile stores.
*/
function collectCandidateAgentDirs(config, env = process.env) {
	const dirs = /* @__PURE__ */ new Set();
	dirs.add(require_home_dir.resolveUserPath(require_agent_scope_config.resolveDefaultAgentDir(config, env), env));
	for (const agentId of require_agent_scope_config.listAgentIds(config)) dirs.add(require_home_dir.resolveUserPath(require_agent_scope_config.resolveAgentDir(config, agentId, env), env));
	return [...dirs];
}
/**
* Combines explicit refresh agent dirs with config-derived dirs for runtime refresh.
*/
function resolveRefreshAgentDirs(config, context) {
	const configDerived = collectCandidateAgentDirs(config, context.env);
	if (!context.explicitAgentDirs || context.explicitAgentDirs.length === 0) return configDerived;
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...context.explicitAgentDirs, ...configDerived]);
}
function resolveCandidateAgentDirs(params) {
	return params.agentDirs?.length ? (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)(params.agentDirs.map((entry) => require_home_dir.resolveUserPath(entry, params.env))) : collectCandidateAgentDirs(params.config, params.env);
}
function hasCandidateAuthProfileStoreSource(agentDir) {
	return (0, node_fs.existsSync)(require_sqlite.resolveAuthProfileDatabasePath(agentDir)) || (0, node_fs.existsSync)(node_path.default.join(agentDir, "auth-profiles.json")) || (0, node_fs.existsSync)(node_path.default.join(agentDir, "auth-state.json")) || (0, node_fs.existsSync)(node_path.default.join(agentDir, "auth.json"));
}
/**
* Returns whether auth profile files or OAuth state exist for candidate agent dirs.
*/
function hasCandidateAuthProfileStoreSources(params) {
	const candidateDirs = resolveCandidateAgentDirs(params);
	const mainAgentDir = require_home_dir.resolveUserPath(require_agent_scope_config.resolveDefaultAgentDir({}, params.env), params.env);
	return candidateDirs.some((agentDir) => hasCandidateAuthProfileStoreSource(agentDir)) || hasCandidateAuthProfileStoreSource(mainAgentDir) || (0, node_fs.existsSync)(require_paths.resolveOAuthPath(params.env));
}
/**
* Creates empty web-tool metadata for snapshots that do not need secret resolution.
*/
function createEmptyRuntimeWebToolsMetadata() {
	return {
		search: {
			providerSource: "none",
			diagnostics: []
		},
		fetch: {
			providerSource: "none",
			diagnostics: []
		},
		diagnostics: []
	};
}
function hasActiveRuntimeWebFetchProviderSurface(fetch, defaults) {
	if (!fetch || typeof fetch !== "object" || Array.isArray(fetch)) return false;
	const fetchConfig = fetch;
	if (fetchConfig.enabled === false) return false;
	if (typeof fetchConfig.provider === "string" && fetchConfig.provider.trim()) return true;
	return require_runtime_secret_scan.hasCredentialBearingObjectValue(fetchConfig, defaults);
}
function hasRuntimeWebToolConfigSurface(config) {
	const web = config.tools?.web;
	const defaults = config.secrets?.defaults;
	const fetchExplicitlyDisabled = web && typeof web === "object" && !Array.isArray(web) && typeof web.fetch === "object" && web.fetch?.enabled === false;
	if (web && typeof web === "object" && !Array.isArray(web)) {
		const webRecord = web;
		if ("search" in webRecord || "x_search" in webRecord) return true;
		if ("fetch" in webRecord && hasActiveRuntimeWebFetchProviderSurface(webRecord.fetch, defaults)) return true;
	}
	const entries = config.plugins?.entries;
	if (!entries || typeof entries !== "object" || Array.isArray(entries)) return false;
	return Object.values(entries).some((entry) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
		const pluginConfig = entry.config;
		return pluginConfig !== null && typeof pluginConfig === "object" && !Array.isArray(pluginConfig) && ("webSearch" in pluginConfig || !fetchExplicitlyDisabled && "webFetch" in pluginConfig);
	});
}
/**
* Returns whether a snapshot can skip full SecretRef/web-tool resolution.
*/
/** Returns whether current config/auth/plugin state allows skipping full secret preparation. */
function canUseSecretsRuntimeFastPath(params) {
	if (hasRuntimeWebToolConfigSurface(params.sourceConfig)) return false;
	const defaults = params.sourceConfig.secrets?.defaults;
	if (require_runtime_secret_scan.hasSecretRefCandidate(params.sourceConfig, defaults)) return false;
	return !params.authStores.some((entry) => require_runtime_secret_scan.hasSecretRefCandidate(entry.store, defaults));
}
/**
* Prepares a runtime snapshot without resolving refs when config and auth stores contain none.
*/
function prepareSecretsRuntimeFastPathSnapshot(params) {
	const runtimeEnv = mergeSecretsRuntimeEnv(params.env);
	const authStoreCredentialsRevision = require_runtime_snapshots.getRuntimeAuthProfileStoreCredentialsRevision();
	const sourceConfig = structuredClone(params.config);
	const resolvedConfig = structuredClone(params.config);
	const includeAuthStoreRefs = params.includeAuthStoreRefs ?? true;
	const candidateDirs = resolveCandidateAgentDirs({
		config: resolvedConfig,
		env: runtimeEnv,
		agentDirs: params.agentDirs
	});
	let authStores = [];
	if (includeAuthStoreRefs) if (!params.loadAuthStore) {
		if (hasCandidateAuthProfileStoreSources({
			config: resolvedConfig,
			env: runtimeEnv,
			agentDirs: candidateDirs
		})) return null;
		authStores = candidateDirs.map((agentDir) => ({
			agentDir,
			store: {
				version: 1,
				profiles: {}
			}
		}));
	} else {
		const loadAuthStore = params.loadAuthStore;
		authStores = candidateDirs.map((agentDir) => ({
			agentDir,
			store: structuredClone(loadAuthStore(agentDir))
		}));
	}
	if (!canUseSecretsRuntimeFastPath({
		sourceConfig,
		authStores
	})) return null;
	return {
		snapshot: {
			sourceConfig,
			config: resolvedConfig,
			authStores,
			authStoreCredentialsRevision,
			warnings: [],
			webTools: createEmptyRuntimeWebToolsMetadata()
		},
		usesAuthStoreFallback: !params.loadAuthStore,
		refreshContext: {
			env: runtimeEnv,
			explicitAgentDirs: params.agentDirs?.length ? [...candidateDirs] : null,
			includeAuthStoreRefs,
			loadablePluginOrigins: params.loadablePluginOrigins ?? /* @__PURE__ */ new Map(),
			...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {},
			...params.loadAuthStore ? { loadAuthStore: params.loadAuthStore } : {}
		}
	};
}
//#endregion
Object.defineProperty(exports, "canUseSecretsRuntimeFastPath", {
	enumerable: true,
	get: function() {
		return canUseSecretsRuntimeFastPath;
	}
});
Object.defineProperty(exports, "collectCandidateAgentDirs", {
	enumerable: true,
	get: function() {
		return collectCandidateAgentDirs;
	}
});
Object.defineProperty(exports, "createEmptyRuntimeWebToolsMetadata", {
	enumerable: true,
	get: function() {
		return createEmptyRuntimeWebToolsMetadata;
	}
});
Object.defineProperty(exports, "mergeSecretsRuntimeEnv", {
	enumerable: true,
	get: function() {
		return mergeSecretsRuntimeEnv;
	}
});
Object.defineProperty(exports, "prepareSecretsRuntimeFastPathSnapshot", {
	enumerable: true,
	get: function() {
		return prepareSecretsRuntimeFastPathSnapshot;
	}
});
Object.defineProperty(exports, "resolveRefreshAgentDirs", {
	enumerable: true,
	get: function() {
		return resolveRefreshAgentDirs;
	}
});
