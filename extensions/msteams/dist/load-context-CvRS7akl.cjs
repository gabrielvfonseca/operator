require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_plugin_metadata_lifecycle = require("./plugin-metadata-lifecycle-L5oN3AE5.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_io = require("./io-DU1xmwPS.cjs");
require("./config-DT0qiglW.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_activation_source_config = require("./activation-source-config-DmXBpErL.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
require("./logging-CPL2M9DX.cjs");
//#region src/plugins/runtime/load-context.ts
const log = require_subsystem.createSubsystemLogger("plugins");
let currentAutoEnableCache;
require_plugin_metadata_lifecycle.registerPluginMetadataProcessMemoLifecycleClear(() => {
	currentAutoEnableCache = void 0;
});
function samePluginIds(left, right) {
	return left === right || left !== void 0 && right !== void 0 && left.length === right.length && left.every((pluginId, index) => pluginId === right[index]);
}
function applyCurrentPluginAutoEnable(params) {
	if (!params.snapshot || !params.manifestRegistry || params.env !== process.env) return require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.config,
		env: params.env,
		manifestRegistry: params.manifestRegistry,
		discovery: params.snapshot?.discovery
	});
	const workspaceDir = params.snapshot.workspaceDir ?? params.workspaceDir;
	const autoEnableConfigFingerprint = require_plugin_auto_enable.fingerprintPluginAutoEnableConfig(params.config);
	const autoEnableEnvFingerprint = require_plugin_auto_enable.fingerprintPluginAutoEnableEnv(params.env);
	const cached = currentAutoEnableCache;
	if (cached?.config === params.config && cached.env === params.env && cached.autoEnableConfigFingerprint === autoEnableConfigFingerprint && cached.autoEnableEnvFingerprint === autoEnableEnvFingerprint && cached.metadataConfigFingerprint === params.snapshot.configFingerprint && cached.policyHash === params.snapshot.policyHash && cached.workspaceDir === workspaceDir && samePluginIds(cached.pluginIds, params.snapshot.pluginIds)) return cached.result;
	const result = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.config,
		env: params.env,
		manifestRegistry: params.manifestRegistry,
		discovery: params.snapshot.discovery
	});
	currentAutoEnableCache = {
		config: params.config,
		env: params.env,
		autoEnableConfigFingerprint,
		autoEnableEnvFingerprint,
		metadataConfigFingerprint: params.snapshot.configFingerprint,
		pluginIds: params.snapshot.pluginIds,
		policyHash: params.snapshot.policyHash,
		result,
		workspaceDir
	};
	return result;
}
/** Creates the default plugin runtime loader logger. */
function createPluginRuntimeLoaderLogger() {
	return {
		info: (message) => log.info(message),
		warn: (message) => log.warn(message),
		error: (message) => log.error(message),
		debug: (message) => log.debug(message)
	};
}
/** Resolves config, manifests, install records, and auto-enable state for runtime loads. */
function resolvePluginRuntimeLoadContext(options) {
	const env = options?.env ?? process.env;
	const rawConfig = options?.config ?? require_io.getRuntimeConfig();
	const rawWorkspaceDir = options?.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(rawConfig, require_agent_scope_config.resolveDefaultAgentId(rawConfig));
	const initialMetadataSnapshot = options?.manifestRegistry === void 0 ? require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config: rawConfig,
		env,
		workspaceDir: rawWorkspaceDir,
		allowWorkspaceScopedCurrent: true
	}) : void 0;
	const manifestRegistry = options?.manifestRegistry ?? initialMetadataSnapshot?.manifestRegistry;
	const activationSourceConfig = require_activation_source_config.resolvePluginActivationSourceConfig({
		config: rawConfig,
		activationSourceConfig: options?.activationSourceConfig
	});
	const autoEnabled = applyCurrentPluginAutoEnable({
		config: rawConfig,
		env,
		workspaceDir: rawWorkspaceDir,
		manifestRegistry,
		snapshot: initialMetadataSnapshot
	});
	const config = autoEnabled.config;
	const workspaceDir = options?.workspaceDir ?? require_agent_scope_config.resolveAgentWorkspaceDir(config, require_agent_scope_config.resolveDefaultAgentId(config));
	const metadataSnapshot = options?.manifestRegistry !== void 0 ? void 0 : initialMetadataSnapshot && require_plugin_metadata_snapshot.isPluginMetadataSnapshotCompatible({
		snapshot: initialMetadataSnapshot,
		config,
		env,
		workspaceDir
	}) ? initialMetadataSnapshot : require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
		config,
		env,
		workspaceDir,
		allowWorkspaceScopedCurrent: true,
		...initialMetadataSnapshot ? { index: initialMetadataSnapshot.index } : {}
	});
	const finalManifestRegistry = options?.manifestRegistry ?? metadataSnapshot?.manifestRegistry;
	const installRecords = metadataSnapshot ? require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(metadataSnapshot.index) : void 0;
	if (metadataSnapshot) if (require_current_plugin_metadata_snapshot.isReusableCurrentPluginMetadataSnapshot(metadataSnapshot)) require_current_plugin_metadata_snapshot.setCurrentPluginMetadataSnapshot(metadataSnapshot, {
		config: rawConfig,
		compatibleConfigs: [config, activationSourceConfig],
		env,
		workspaceDir
	});
	else require_current_plugin_metadata_snapshot.clearCurrentPluginMetadataSnapshot();
	return {
		rawConfig,
		config,
		activationSourceConfig,
		autoEnabledReasons: autoEnabled.autoEnabledReasons,
		workspaceDir,
		env,
		logger: options?.logger ?? createPluginRuntimeLoaderLogger(),
		...finalManifestRegistry ? { manifestRegistry: finalManifestRegistry } : {},
		installRecords
	};
}
/** Builds plugin load options from a resolved runtime load context. */
function buildPluginRuntimeLoadOptions(context, overrides) {
	return buildPluginRuntimeLoadOptionsFromValues(context, overrides);
}
/** Builds plugin load options from explicit runtime load values. */
function buildPluginRuntimeLoadOptionsFromValues(values, overrides) {
	return {
		config: values.config,
		activationSourceConfig: values.activationSourceConfig,
		autoEnabledReasons: values.autoEnabledReasons,
		workspaceDir: values.workspaceDir,
		env: values.env,
		logger: values.logger,
		manifestRegistry: values.manifestRegistry,
		installRecords: values.installRecords,
		...overrides
	};
}
//#endregion
Object.defineProperty(exports, "buildPluginRuntimeLoadOptions", {
	enumerable: true,
	get: function() {
		return buildPluginRuntimeLoadOptions;
	}
});
Object.defineProperty(exports, "buildPluginRuntimeLoadOptionsFromValues", {
	enumerable: true,
	get: function() {
		return buildPluginRuntimeLoadOptionsFromValues;
	}
});
Object.defineProperty(exports, "createPluginRuntimeLoaderLogger", {
	enumerable: true,
	get: function() {
		return createPluginRuntimeLoaderLogger;
	}
});
Object.defineProperty(exports, "resolvePluginRuntimeLoadContext", {
	enumerable: true,
	get: function() {
		return resolvePluginRuntimeLoadContext;
	}
});
