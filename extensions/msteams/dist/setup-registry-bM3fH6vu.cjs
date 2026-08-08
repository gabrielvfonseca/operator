const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_plugin_cache_primitives = require("./plugin-cache-primitives-DGHa8Ph9.cjs");
const require_plugin_module_loader_cache = require("./plugin-module-loader-cache-C_Mm0NZ7.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_api_builder = require("./api-builder-CwclmNZ2.cjs");
const require_config_contract_matches = require("./config-contract-matches-BOy7ZHza.cjs");
require("./config-contracts-DUBBUbeG.cjs");
const require_setup_descriptors = require("./setup-descriptors-BNQbs9nE.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_url = require("node:url");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/setup-registry-loader-state.ts
/** Shared loader state for plugin setup registration and test fixtures. */
const pluginSetupRegistryLoaderState = {
	moduleLoaders: require_plugin_module_loader_cache.createPluginModuleLoaderCache(),
	moduleLoaderFactory: void 0
};
//#endregion
//#region src/plugins/setup-registry.ts
var setup_registry_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	resolvePluginSetupAutoEnableReasons: () => resolvePluginSetupAutoEnableReasons,
	resolvePluginSetupCliBackend: () => resolvePluginSetupCliBackend,
	resolvePluginSetupProvider: () => resolvePluginSetupProvider,
	resolvePluginSetupRegistry: () => resolvePluginSetupRegistry,
	runPluginSetupConfigMigrations: () => runPluginSetupConfigMigrations
});
const SETUP_API_EXTENSIONS = [
	".js",
	".mjs",
	".cjs",
	".ts",
	".mts",
	".cts"
];
const CURRENT_MODULE_PATH = (0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href);
const RUNNING_FROM_BUILT_ARTIFACT = CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist${node_path.default.sep}`) || CURRENT_MODULE_PATH.includes(`${node_path.default.sep}dist-runtime${node_path.default.sep}`);
const EMPTY_RUNTIME = {};
const NOOP_LOGGER = {
	info() {},
	warn() {},
	error() {}
};
const MAX_SETUP_REGISTRY_CACHE_ENTRIES = 16;
let setupRegistrySnapshotIdSeq = 0;
let setupRegistrySnapshotIds = /* @__PURE__ */ new WeakMap();
const setupManifestRegistryCache = new require_plugin_cache_primitives.PluginLruCache(MAX_SETUP_REGISTRY_CACHE_ENTRIES);
const pluginSetupRegistryCache = new require_plugin_cache_primitives.PluginLruCache(MAX_SETUP_REGISTRY_CACHE_ENTRIES);
function clearPluginSetupRegistryCache() {
	pluginSetupRegistryLoaderState.moduleLoaders.clear();
	setupRegistrySnapshotIds = /* @__PURE__ */ new WeakMap();
	setupManifestRegistryCache.clear();
	pluginSetupRegistryCache.clear();
}
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(clearPluginSetupRegistryCache);
function getModuleLoader(modulePath) {
	return require_plugin_module_loader_cache.getCachedPluginModuleLoader({
		cache: pluginSetupRegistryLoaderState.moduleLoaders,
		modulePath,
		importerUrl: require("url").pathToFileURL(__filename).href,
		...pluginSetupRegistryLoaderState.moduleLoaderFactory ? { createLoader: pluginSetupRegistryLoaderState.moduleLoaderFactory } : {}
	});
}
function resolveSetupApiPath(rootDir, options) {
	const orderedExtensions = RUNNING_FROM_BUILT_ARTIFACT ? SETUP_API_EXTENSIONS : [...SETUP_API_EXTENSIONS.slice(3), ...SETUP_API_EXTENSIONS.slice(0, 3)];
	const findSetupApi = (candidateRootDir) => {
		for (const extension of orderedExtensions) {
			const candidate = node_path.default.join(candidateRootDir, `setup-api${extension}`);
			if (node_fs.default.existsSync(candidate)) return candidate;
		}
		return null;
	};
	const direct = findSetupApi(rootDir);
	if (direct) return direct;
	if (options?.includeBundledSourceFallback === false) return null;
	const bundledExtensionDir = node_path.default.basename(rootDir);
	const repoRootCandidates = [node_path.default.resolve(node_path.default.dirname(CURRENT_MODULE_PATH), "..", "..")];
	for (const repoRoot of repoRootCandidates) {
		const sourceExtensionRoot = node_path.default.join(repoRoot, "extensions", bundledExtensionDir);
		if (sourceExtensionRoot === rootDir) continue;
		const sourceFallback = findSetupApi(sourceExtensionRoot);
		if (sourceFallback) return sourceFallback;
	}
	return null;
}
function collectConfiguredPluginEntryIds(config) {
	const entries = config.plugins?.entries;
	if (!entries || typeof entries !== "object") return [];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(Object.keys(entries)).toSorted();
}
function resolveRelevantSetupMigrationPluginIds(params) {
	const ids = new Set(collectConfiguredPluginEntryIds(params.config));
	const registry = loadSetupManifestRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env
	});
	for (const plugin of registry.plugins) {
		const paths = plugin.configContracts?.compatibilityMigrationPaths;
		if (!paths?.length) continue;
		if (paths.some((pathPattern) => require_config_contract_matches.collectPluginConfigContractMatches({
			root: params.config,
			pathPattern
		}).length > 0)) ids.add(plugin.id);
	}
	return [...ids].toSorted();
}
function resolveRegister(mod) {
	if (typeof mod === "function") return { register: mod };
	if (mod && typeof mod === "object" && typeof mod.register === "function") return {
		definition: mod,
		register: mod.register.bind(mod)
	};
	return {};
}
function rewriteBundledSetupSourceToBuiltArtifact(source, record) {
	if (record.origin !== "bundled") return source;
	const rootDir = node_path.default.resolve(record.rootDir);
	const sourcePath = node_path.default.resolve(source);
	const extensionsDir = node_path.default.dirname(rootDir);
	if (node_path.default.basename(extensionsDir) !== "extensions") return source;
	const packageRoot = node_path.default.dirname(extensionsDir);
	if (node_path.default.basename(packageRoot) === "dist" || node_path.default.basename(packageRoot) === "dist-runtime") return source;
	const relativeSource = node_path.default.relative(rootDir, sourcePath);
	if (relativeSource === "" || relativeSource.startsWith("..") || node_path.default.isAbsolute(relativeSource)) return source;
	const artifactRelativePath = relativeSource.replace(/\.[^.]+$/u, ".js");
	for (const artifactRootName of ["dist-runtime", "dist"]) {
		const candidate = node_path.default.join(packageRoot, artifactRootName, "extensions", node_path.default.basename(rootDir), artifactRelativePath);
		if (node_fs.default.existsSync(candidate)) return candidate;
	}
	return source;
}
function resolveLoadableSetupRuntimeSource(record) {
	const source = record.setupSource ?? resolveSetupApiPath(record.rootDir);
	return source ? rewriteBundledSetupSourceToBuiltArtifact(source, record) : null;
}
function resolveDeclaredSetupRuntimeSource(record) {
	return record.setupSource ?? resolveSetupApiPath(record.rootDir, { includeBundledSourceFallback: false });
}
function resolveSetupRegistration(record) {
	if (record.setup?.requiresRuntime === false) return null;
	const setupSource = resolveLoadableSetupRuntimeSource(record);
	if (!setupSource) return null;
	let mod;
	try {
		mod = getModuleLoader(setupSource)(setupSource);
	} catch {
		return null;
	}
	const resolved = resolveRegister(mod.default ?? mod);
	if (!resolved.register) return null;
	if (resolved.definition?.id && resolved.definition.id !== record.id) return null;
	return {
		setupSource,
		register: resolved.register
	};
}
function buildSetupPluginApi(params) {
	return require_api_builder.buildPluginApi({
		id: params.record.id,
		name: params.record.name ?? params.record.id,
		version: params.record.version,
		description: params.record.description,
		source: params.setupSource,
		rootDir: params.record.rootDir,
		registrationMode: "setup-only",
		config: {},
		runtime: EMPTY_RUNTIME,
		logger: NOOP_LOGGER,
		resolvePath: (input) => input,
		handlers: params.handlers
	});
}
function ignoreAsyncSetupRegisterResult(result) {
	if (!result || typeof result.then !== "function") return;
	Promise.resolve(result).catch(() => void 0);
}
function matchesProvider(provider, providerId) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(providerId);
	if ((0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id) === normalized) return true;
	return [...provider.aliases ?? [], ...provider.hookAliases ?? []].some((alias) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(alias) === normalized);
}
function resolveSetupRegistryCacheKey(params) {
	const env = params?.env ?? process.env;
	if (env !== process.env) return null;
	return require_plugin_cache_primitives.createPluginCacheKey([
		"setup-registry",
		require_current_plugin_metadata_snapshot.resolvePluginControlPlaneFingerprint({
			config: params?.config,
			env,
			workspaceDir: params?.workspaceDir
		}),
		require_plugin_metadata_snapshot.resolvePluginMetadataSnapshotMemoEnvFingerprint(env),
		resolveCurrentSetupSnapshotCacheId(),
		process.cwd(),
		params?.pluginIds ? [...params.pluginIds].toSorted() : null
	]);
}
function resolveCurrentSetupSnapshotCacheId() {
	const { snapshot } = require_plugin_metadata_lifecycle.getCurrentPluginMetadataSnapshotState();
	if (!snapshot || typeof snapshot !== "object") return "nosnap";
	let id = setupRegistrySnapshotIds.get(snapshot);
	if (id === void 0) {
		id = `s${++setupRegistrySnapshotIdSeq}`;
		setupRegistrySnapshotIds.set(snapshot, id);
	}
	return id;
}
function cloneSetupRegistryValue(value, seen = /* @__PURE__ */ new WeakMap()) {
	if (!value || typeof value !== "object") return value;
	const cached = seen.get(value);
	if (cached !== void 0) return cached;
	if (value instanceof Date) {
		const clone = new Date(value);
		seen.set(value, clone);
		return clone;
	}
	if (value instanceof RegExp) {
		const clone = new RegExp(value.source, value.flags);
		clone.lastIndex = value.lastIndex;
		seen.set(value, clone);
		return clone;
	}
	if (Array.isArray(value)) {
		const clone = [];
		seen.set(value, clone);
		clone.push(...value.map((entry) => cloneSetupRegistryValue(entry, seen)));
		return clone;
	}
	if (value instanceof Map) {
		const clone = /* @__PURE__ */ new Map();
		seen.set(value, clone);
		for (const [key, entry] of value.entries()) clone.set(cloneSetupRegistryValue(key, seen), cloneSetupRegistryValue(entry, seen));
		return clone;
	}
	if (value instanceof Set) {
		const clone = /* @__PURE__ */ new Set();
		seen.set(value, clone);
		for (const entry of value.values()) clone.add(cloneSetupRegistryValue(entry, seen));
		return clone;
	}
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return value;
	const clone = Object.create(prototype);
	seen.set(value, clone);
	for (const key of Reflect.ownKeys(value)) {
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor) continue;
		if ("value" in descriptor) descriptor.value = cloneSetupRegistryValue(descriptor.value, seen);
		Object.defineProperty(clone, key, descriptor);
	}
	return clone;
}
function cloneSetupRegistry(registry) {
	return cloneSetupRegistryValue(registry);
}
function loadSetupManifestRegistry(params) {
	const env = params?.env ?? process.env;
	const cacheKey = resolveSetupRegistryCacheKey(params);
	if (cacheKey !== null) {
		const cached = setupManifestRegistryCache.get(cacheKey);
		if (cached) return cached;
	}
	const registry = require_plugin_registry.loadPluginManifestRegistryForPluginRegistry({
		config: params?.config,
		workspaceDir: params?.workspaceDir,
		env,
		pluginIds: params?.pluginIds,
		includeDisabled: true
	});
	if (cacheKey !== null) setupManifestRegistryCache.set(cacheKey, registry);
	return registry;
}
function findUniqueSetupManifestOwner(params) {
	const matches = params.registry.plugins.filter((entry) => params.listIds(entry).some((id) => (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(id) === params.normalizedId));
	if (matches.length === 0) return;
	return matches.length === 1 ? matches[0] : void 0;
}
function mapNormalizedIds(ids) {
	const mapped = /* @__PURE__ */ new Map();
	for (const id of ids) {
		const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(id);
		if (!normalized || mapped.has(normalized)) continue;
		mapped.set(normalized, id);
	}
	return mapped;
}
function pushDescriptorRuntimeDisabledDiagnostic(params) {
	if (!resolveDeclaredSetupRuntimeSource(params.record)) return;
	params.diagnostics.push({
		pluginId: params.record.id,
		code: "setup-descriptor-runtime-disabled",
		message: "setup.requiresRuntime is false, so Operator ignored the plugin setup runtime entry. Remove setup-api/operator.setupEntry or set requiresRuntime true if setup lookup still needs plugin code."
	});
}
function pushSetupDescriptorDriftDiagnostics(params) {
	const declaredProviderIds = params.record.setup?.providers?.map((entry) => entry.id);
	if (declaredProviderIds) {
		for (const declaredId of declaredProviderIds) if (!params.providers.some((provider) => matchesProvider(provider, declaredId))) params.diagnostics.push({
			pluginId: params.record.id,
			code: "setup-descriptor-provider-missing-runtime",
			declaredId,
			message: `setup.providers declares "${declaredId}" but setup runtime did not register a matching provider.`
		});
		for (const provider of params.providers) if (!declaredProviderIds.some((declaredId) => matchesProvider(provider, declaredId))) params.diagnostics.push({
			pluginId: params.record.id,
			code: "setup-descriptor-provider-runtime-undeclared",
			runtimeId: provider.id,
			message: `setup runtime registered provider "${provider.id}" but setup.providers does not declare it.`
		});
	}
	const declaredCliBackendIds = params.record.setup?.cliBackends;
	if (declaredCliBackendIds) {
		const declaredCliBackends = mapNormalizedIds(declaredCliBackendIds);
		const runtimeCliBackends = mapNormalizedIds(params.cliBackends.map((backend) => backend.id));
		for (const [normalized, declaredId] of declaredCliBackends) if (!runtimeCliBackends.has(normalized)) params.diagnostics.push({
			pluginId: params.record.id,
			code: "setup-descriptor-cli-backend-missing-runtime",
			declaredId,
			message: `setup.cliBackends declares "${declaredId}" but setup runtime did not register a matching CLI backend.`
		});
		for (const [normalized, runtimeId] of runtimeCliBackends) if (!declaredCliBackends.has(normalized)) params.diagnostics.push({
			pluginId: params.record.id,
			code: "setup-descriptor-cli-backend-runtime-undeclared",
			runtimeId,
			message: `setup runtime registered CLI backend "${runtimeId}" but setup.cliBackends does not declare it.`
		});
	}
}
function resolvePluginSetupRegistry(params) {
	const env = params?.env ?? process.env;
	const scopedPluginIds = params?.pluginIds ? new Set((0, _gabrielvfonseca_normalization_core_string_normalization.normalizeUniqueStringEntries)(params.pluginIds)) : null;
	if (scopedPluginIds && scopedPluginIds.size === 0) return {
		providers: [],
		cliBackends: [],
		configMigrations: [],
		autoEnableProbes: [],
		diagnostics: []
	};
	const resultCacheKey = params?.manifestRegistry ? null : resolveSetupRegistryCacheKey(params);
	if (resultCacheKey !== null) {
		const cached = pluginSetupRegistryCache.get(resultCacheKey);
		if (cached) return cloneSetupRegistry(cached);
	}
	const providers = [];
	const cliBackends = [];
	const configMigrations = [];
	const autoEnableProbes = [];
	const diagnostics = [];
	const providerKeys = /* @__PURE__ */ new Set();
	const cliBackendKeys = /* @__PURE__ */ new Set();
	const manifestRegistry = params?.manifestRegistry ?? loadSetupManifestRegistry({
		config: params?.config,
		workspaceDir: params?.workspaceDir,
		env,
		pluginIds: params?.pluginIds
	});
	for (const record of manifestRegistry.plugins) {
		if (scopedPluginIds && !scopedPluginIds.has(record.id)) continue;
		if (record.setup?.requiresRuntime === false) {
			pushDescriptorRuntimeDisabledDiagnostic({
				record,
				diagnostics
			});
			continue;
		}
		const setupRegistration = resolveSetupRegistration(record);
		if (!setupRegistration) continue;
		const recordProviders = [];
		const recordCliBackends = [];
		const api = buildSetupPluginApi({
			record,
			setupSource: setupRegistration.setupSource,
			handlers: {
				registerProvider(provider) {
					const key = `${record.id}:${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id)}`;
					if (providerKeys.has(key)) return;
					providerKeys.add(key);
					providers.push({
						pluginId: record.id,
						provider
					});
					recordProviders.push(provider);
				},
				registerCliBackend(backend) {
					const key = `${record.id}:${(0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(backend.id)}`;
					if (cliBackendKeys.has(key)) return;
					cliBackendKeys.add(key);
					cliBackends.push({
						pluginId: record.id,
						backend
					});
					recordCliBackends.push(backend);
				},
				registerConfigMigration(migrate) {
					configMigrations.push({
						pluginId: record.id,
						migrate
					});
				},
				registerAutoEnableProbe(probe) {
					autoEnableProbes.push({
						pluginId: record.id,
						probe
					});
				}
			}
		});
		try {
			const result = setupRegistration.register(api);
			if (result && typeof result.then === "function") ignoreAsyncSetupRegisterResult(result);
		} catch {
			continue;
		}
		pushSetupDescriptorDriftDiagnostics({
			record,
			providers: recordProviders,
			cliBackends: recordCliBackends,
			diagnostics
		});
	}
	const registry = {
		providers,
		cliBackends,
		configMigrations,
		autoEnableProbes,
		diagnostics
	};
	if (resultCacheKey === null) return registry;
	pluginSetupRegistryCache.set(resultCacheKey, cloneSetupRegistry(registry));
	return registry;
}
function resolvePluginSetupProvider(params) {
	const env = params.env ?? process.env;
	const normalizedProvider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider);
	const record = findUniqueSetupManifestOwner({
		registry: loadSetupManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env,
			pluginIds: params.pluginIds
		}),
		normalizedId: normalizedProvider,
		listIds: require_setup_descriptors.listSetupProviderIds
	});
	if (!record) return;
	const setupRegistration = resolveSetupRegistration(record);
	if (!setupRegistration) return;
	let matchedProvider;
	const localProviderKeys = /* @__PURE__ */ new Set();
	const api = buildSetupPluginApi({
		record,
		setupSource: setupRegistration.setupSource,
		handlers: {
			registerProvider(provider) {
				const key = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider.id);
				if (localProviderKeys.has(key)) return;
				localProviderKeys.add(key);
				if (matchesProvider(provider, normalizedProvider)) matchedProvider = provider;
			},
			registerConfigMigration() {},
			registerAutoEnableProbe() {}
		}
	});
	try {
		const result = setupRegistration.register(api);
		if (result && typeof result.then === "function") ignoreAsyncSetupRegisterResult(result);
	} catch {
		return;
	}
	return matchedProvider;
}
function resolvePluginSetupCliBackend(params) {
	const normalized = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.backend);
	const env = params.env ?? process.env;
	const record = findUniqueSetupManifestOwner({
		registry: loadSetupManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env
		}),
		normalizedId: normalized,
		listIds: require_setup_descriptors.listSetupCliBackendIds
	});
	if (!record) return;
	const setupRegistration = resolveSetupRegistration(record);
	if (!setupRegistration) return;
	let matchedBackend;
	const localBackendKeys = /* @__PURE__ */ new Set();
	const api = buildSetupPluginApi({
		record,
		setupSource: setupRegistration.setupSource,
		handlers: {
			registerProvider() {},
			registerConfigMigration() {},
			registerAutoEnableProbe() {},
			registerCliBackend(backend) {
				const key = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(backend.id);
				if (localBackendKeys.has(key)) return;
				localBackendKeys.add(key);
				if (key === normalized) matchedBackend = backend;
			}
		}
	});
	try {
		const result = setupRegistration.register(api);
		if (result && typeof result.then === "function") ignoreAsyncSetupRegisterResult(result);
	} catch {
		return;
	}
	return (matchedBackend ? {
		pluginId: record.id,
		backend: matchedBackend
	} : null) ?? void 0;
}
function runPluginSetupConfigMigrations(params) {
	let next = params.config;
	const changes = [];
	const pluginIds = resolveRelevantSetupMigrationPluginIds(params);
	if (pluginIds.length === 0) return {
		config: next,
		changes
	};
	for (const entry of resolvePluginSetupRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		pluginIds
	}).configMigrations) {
		const migration = entry.migrate(next);
		if (!migration || migration.changes.length === 0) continue;
		next = migration.config;
		changes.push(...migration.changes);
	}
	return {
		config: next,
		changes
	};
}
function resolvePluginSetupAutoEnableReasons(params) {
	const env = params.env ?? process.env;
	const reasons = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of resolvePluginSetupRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env,
		pluginIds: params.pluginIds,
		manifestRegistry: params.manifestRegistry
	}).autoEnableProbes) {
		const raw = entry.probe({
			config: params.config,
			env
		});
		const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
		for (const reason of values) {
			const normalized = reason.trim();
			if (!normalized) continue;
			const key = `${entry.pluginId}:${normalized}`;
			if (seen.has(key)) continue;
			seen.add(key);
			reasons.push({
				pluginId: entry.pluginId,
				reason: normalized
			});
		}
	}
	return reasons;
}
//#endregion
Object.defineProperty(exports, "resolvePluginSetupAutoEnableReasons", {
	enumerable: true,
	get: function() {
		return resolvePluginSetupAutoEnableReasons;
	}
});
Object.defineProperty(exports, "resolvePluginSetupCliBackend", {
	enumerable: true,
	get: function() {
		return resolvePluginSetupCliBackend;
	}
});
Object.defineProperty(exports, "resolvePluginSetupProvider", {
	enumerable: true,
	get: function() {
		return resolvePluginSetupProvider;
	}
});
Object.defineProperty(exports, "resolvePluginSetupRegistry", {
	enumerable: true,
	get: function() {
		return resolvePluginSetupRegistry;
	}
});
Object.defineProperty(exports, "runPluginSetupConfigMigrations", {
	enumerable: true,
	get: function() {
		return runPluginSetupConfigMigrations;
	}
});
Object.defineProperty(exports, "setup_registry_exports", {
	enumerable: true,
	get: function() {
		return setup_registry_exports;
	}
});
