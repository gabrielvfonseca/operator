const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_parse_json_compat = require("./parse-json-compat-C77_sznm.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_facade_resolution_shared = require("./facade-resolution-shared-1HkdxhGD.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#endregion
//#region src/plugin-sdk/facade-activation-check.runtime.ts
/**
* Runtime boundary checks for bundled plugin public-surface facade imports.
*/
const ALWAYS_ALLOWED_RUNTIME_DIR_NAME_SET = /* @__PURE__ */ new Set(["image-generation-core", "media-understanding-core"]);
const EMPTY_FACADE_BOUNDARY_CONFIG = {};
function readFacadeBoundaryConfigSafely() {
	try {
		const sourceSnapshot = require_runtime_snapshot.getRuntimeConfigSourceSnapshot();
		if (sourceSnapshot) return { rawConfig: sourceSnapshot };
		const runtimeSnapshot = require_runtime_snapshot.getRuntimeConfigSnapshot();
		if (runtimeSnapshot) return { rawConfig: runtimeSnapshot };
		const configPath = require_paths.resolveConfigPath();
		if (!node_fs.default.existsSync(configPath)) return { rawConfig: EMPTY_FACADE_BOUNDARY_CONFIG };
		const parsed = require_parse_json_compat.parseJsonWithJson5Fallback(node_fs.default.readFileSync(configPath, "utf8"));
		return { rawConfig: parsed && typeof parsed === "object" ? parsed : EMPTY_FACADE_BOUNDARY_CONFIG };
	} catch {
		return { rawConfig: EMPTY_FACADE_BOUNDARY_CONFIG };
	}
}
function getFacadeBoundaryResolvedConfig() {
	const { rawConfig } = readFacadeBoundaryConfigSafely();
	const autoEnabled = require_plugin_auto_enable.configMayNeedPluginAutoEnable(rawConfig, process.env) ? require_plugin_auto_enable.applyPluginAutoEnable({
		config: rawConfig,
		env: process.env
	}) : {
		config: rawConfig,
		autoEnabledReasons: {}
	};
	const config = autoEnabled.config;
	return {
		rawConfig,
		config,
		normalizedPluginsConfig: require_config_state.normalizePluginsConfig(config?.plugins),
		activationSource: require_config_state.createPluginActivationSource({ config: rawConfig }),
		autoEnabledReasons: autoEnabled.autoEnabledReasons
	};
}
function getFacadeManifestRegistry(params) {
	const envOption = params.env ? { env: params.env } : {};
	const resolved = getFacadeBoundaryResolvedConfig();
	const current = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: resolved.config,
		...envOption,
		allowWorkspaceScopedSnapshot: true
	});
	if (current?.manifestRegistry) return current.manifestRegistry.plugins;
	return require_manifest_registry.loadPluginManifestRegistry({
		config: resolved.config,
		...envOption
	}).plugins;
}
/** Resolves the concrete plugin module location recorded in the manifest registry. */
function resolveRegistryPluginModuleLocation(params) {
	return require_facade_resolution_shared.resolveRegistryPluginModuleLocationFromRecords({
		registry: getFacadeManifestRegistry(params.env ? { env: params.env } : {}),
		dirName: params.dirName,
		artifactBasename: params.artifactBasename
	});
}
function readBundledPluginManifestRecordFromDir(params) {
	const manifestPath = node_path.default.join(params.pluginsRoot, params.resolvedDirName, "operator.plugin.json");
	if (!node_fs.default.existsSync(manifestPath)) return null;
	try {
		const raw = require_parse_json_compat.parseJsonWithJson5Fallback(node_fs.default.readFileSync(manifestPath, "utf8"));
		if (typeof raw.id !== "string" || raw.id.trim().length === 0) return null;
		return {
			id: raw.id,
			origin: "bundled",
			enabledByDefault: raw.enabledByDefault === true,
			rootDir: node_path.default.join(params.pluginsRoot, params.resolvedDirName),
			channels: Array.isArray(raw.channels) ? raw.channels.filter((entry) => typeof entry === "string") : []
		};
	} catch {
		return null;
	}
}
function resolveBundledMetadataManifestRecord(params) {
	if (!params.location) return null;
	if (params.location.modulePath.startsWith(`${params.sourceExtensionsRoot}${node_path.default.sep}`)) {
		const resolvedDirName = node_path.default.relative(params.sourceExtensionsRoot, params.location.modulePath).split(node_path.default.sep)[0];
		if (!resolvedDirName) return null;
		return readBundledPluginManifestRecordFromDir({
			pluginsRoot: params.sourceExtensionsRoot,
			resolvedDirName
		});
	}
	const bundledPluginsDir = require_bundled_dir.resolveBundledPluginsDir(params.env ?? process.env);
	if (!bundledPluginsDir) return null;
	const normalizedBundledPluginsDir = node_path.default.resolve(bundledPluginsDir);
	if (!params.location.modulePath.startsWith(`${normalizedBundledPluginsDir}${node_path.default.sep}`)) return null;
	const resolvedDirName = node_path.default.relative(normalizedBundledPluginsDir, params.location.modulePath).split(node_path.default.sep)[0];
	if (!resolvedDirName) return null;
	return readBundledPluginManifestRecordFromDir({
		pluginsRoot: normalizedBundledPluginsDir,
		resolvedDirName
	});
}
function resolveBundledPluginManifestRecord(params) {
	const metadataRecord = resolveBundledMetadataManifestRecord(params);
	if (metadataRecord) return metadataRecord;
	const registry = getFacadeManifestRegistry(params.env ? { env: params.env } : {});
	return (params.location ? registry.find((plugin) => {
		const normalizedRootDir = node_path.default.resolve(plugin.rootDir);
		const normalizedModulePath = node_path.default.resolve(params.location.modulePath);
		return normalizedModulePath === normalizedRootDir || normalizedModulePath.startsWith(`${normalizedRootDir}${node_path.default.sep}`);
	}) : null) ?? registry.find((plugin) => plugin.id === params.dirName) ?? registry.find((plugin) => node_path.default.basename(plugin.rootDir) === params.dirName) ?? registry.find((plugin) => plugin.channels.includes(params.dirName)) ?? null;
}
/** Resolves the stable plugin id used for telemetry and error reporting. */
function resolveTrackedFacadePluginId(params) {
	return resolveBundledPluginManifestRecord(params)?.id ?? params.dirName;
}
/** Evaluates whether a bundled plugin's api/runtime-api facade is currently enabled. */
function resolveBundledPluginPublicSurfaceAccess(params) {
	if (params.artifactBasename === "runtime-api.js" && ALWAYS_ALLOWED_RUNTIME_DIR_NAME_SET.has(params.dirName)) return {
		allowed: true,
		pluginId: params.dirName
	};
	const manifestRecord = resolveBundledPluginManifestRecord(params);
	if (!manifestRecord) return {
		allowed: false,
		reason: `no bundled plugin manifest found for ${params.dirName}`
	};
	const { config, normalizedPluginsConfig, activationSource, autoEnabledReasons } = getFacadeBoundaryResolvedConfig();
	return evaluateBundledPluginPublicSurfaceAccess({
		params,
		manifestRecord,
		config,
		normalizedPluginsConfig,
		activationSource,
		autoEnabledReasons
	});
}
/** Applies normalized config and default enablement rules to one bundled manifest. */
function evaluateBundledPluginPublicSurfaceAccess(params) {
	const activationState = require_config_state.resolveEffectivePluginActivationState({
		id: params.manifestRecord.id,
		origin: params.manifestRecord.origin,
		config: params.normalizedPluginsConfig,
		rootConfig: params.config,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(params.manifestRecord),
		activationSource: params.activationSource,
		autoEnabledReason: params.autoEnabledReasons[params.manifestRecord.id]?.[0]
	});
	if (activationState.enabled) return {
		allowed: true,
		pluginId: params.manifestRecord.id
	};
	return {
		allowed: false,
		pluginId: params.manifestRecord.id,
		reason: activationState.reason ?? "plugin runtime is not activated"
	};
}
/** Throws the public error used when a disabled bundled plugin facade is imported. */
function throwForBundledPluginPublicSurfaceAccess(params) {
	const pluginLabel = params.access.pluginId ?? params.request.dirName;
	throw new Error(`Bundled plugin public surface access blocked for "${pluginLabel}" via ${params.request.dirName}/${params.request.artifactBasename}: ${params.access.reason ?? "plugin runtime is not activated"}`);
}
/** Resolves bundled facade access and throws unless the facade is allowed to load. */
function resolveActivatedBundledPluginPublicSurfaceAccessOrThrow(params) {
	const access = resolveBundledPluginPublicSurfaceAccess(params);
	if (!access.allowed) throwForBundledPluginPublicSurfaceAccess({
		access,
		request: params
	});
	return access;
}
//#endregion
exports.evaluateBundledPluginPublicSurfaceAccess = evaluateBundledPluginPublicSurfaceAccess;
exports.resolveActivatedBundledPluginPublicSurfaceAccessOrThrow = resolveActivatedBundledPluginPublicSurfaceAccessOrThrow;
exports.resolveBundledPluginPublicSurfaceAccess = resolveBundledPluginPublicSurfaceAccess;
exports.resolveRegistryPluginModuleLocation = resolveRegistryPluginModuleLocation;
exports.resolveTrackedFacadePluginId = resolveTrackedFacadePluginId;
exports.throwForBundledPluginPublicSurfaceAccess = throwForBundledPluginPublicSurfaceAccess;
