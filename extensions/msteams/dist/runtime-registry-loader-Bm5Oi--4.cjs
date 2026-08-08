const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
const require_effective_plugin_ids = require("./effective-plugin-ids-CKSMv2rl.cjs");
//#region src/plugins/runtime/runtime-registry-loader.ts
var runtime_registry_loader_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ ensurePluginRegistryLoaded: () => ensurePluginRegistryLoaded });
let pluginRegistryLoaded = "none";
function scopeRank(scope) {
	switch (scope) {
		case "none": return 0;
		case "configured-channels": return 1;
		case "channels": return 2;
		case "all": return 3;
	}
	throw new Error("Unsupported plugin registry scope");
}
function activeRegistrySatisfiesScope(scope, active, expectedChannelPluginIds, requestedPluginIds, requestedWorkspaceDir) {
	if (!active) return false;
	if (requestedPluginIds !== void 0) {
		const activeWorkspaceDir = require_runtime.getActivePluginRegistryWorkspaceDir();
		if (requestedWorkspaceDir !== void 0 && activeWorkspaceDir !== requestedWorkspaceDir) return false;
		return require_active_runtime_registry.registryContainsRuntimePluginIds(active, requestedPluginIds);
	}
	const activeChannelPluginIds = new Set(active.channels.map((entry) => entry.plugin.id));
	switch (scope) {
		case "configured-channels":
		case "channels": return active.channels.length > 0 && expectedChannelPluginIds.every((pluginId) => activeChannelPluginIds.has(pluginId));
		case "all": return false;
	}
	throw new Error("Unsupported plugin registry scope");
}
function shouldForwardChannelScope(params) {
	return !params.scopedLoad && params.scope === "configured-channels";
}
function resolveScopePluginIds(params) {
	switch (params.scope) {
		case "configured-channels": return require_channel_presence_policy.resolveConfiguredChannelPluginIds({
			config: params.context.config,
			activationSourceConfig: params.context.activationSourceConfig,
			workspaceDir: params.context.workspaceDir,
			env: params.context.env
		});
		case "channels": return require_gateway_startup_plugin_ids.resolveChannelPluginIds({
			config: params.context.config,
			workspaceDir: params.context.workspaceDir,
			env: params.context.env
		});
		case "all": return require_effective_plugin_ids.resolveEffectivePluginIds({
			config: params.context.rawConfig,
			workspaceDir: params.context.workspaceDir,
			env: params.context.env
		});
	}
	return params.scope;
}
function resolveOrLoadRuntimePluginRegistry(loadOptions) {
	if (!require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: loadOptions.env,
		loadOptions,
		workspaceDir: loadOptions.workspaceDir,
		requiredPluginIds: loadOptions.onlyPluginIds
	})) require_loader.loadOperatorPlugins(loadOptions);
}
function ensurePluginRegistryLoaded(options) {
	const scope = options?.scope ?? "all";
	const requestedPluginIdsFromOptions = require_current_plugin_metadata_snapshot.normalizePluginIdScope(options?.onlyPluginIds);
	const requestedChannelIds = require_current_plugin_metadata_snapshot.normalizePluginIdScope(options?.onlyChannelIds);
	const context = require_load_context.resolvePluginRuntimeLoadContext(options);
	const requestedChannelOwnerPluginIds = requestedChannelIds === void 0 ? void 0 : require_channel_presence_policy.resolveDiscoverableScopedChannelPluginIds({
		config: context.config,
		activationSourceConfig: context.activationSourceConfig,
		channelIds: requestedChannelIds,
		workspaceDir: context.workspaceDir,
		env: context.env
	});
	const requestedPluginIds = requestedChannelOwnerPluginIds === void 0 ? requestedPluginIdsFromOptions : require_current_plugin_metadata_snapshot.normalizePluginIdScope([...requestedPluginIdsFromOptions ?? [], ...requestedChannelOwnerPluginIds]);
	const scopedLoad = require_current_plugin_metadata_snapshot.hasExplicitPluginIdScope(requestedPluginIds);
	const expectedPluginIds = scopedLoad ? requestedPluginIds ?? [] : resolveScopePluginIds({
		scope,
		context
	});
	const active = require_runtime.getActivePluginRegistry();
	const requestedPluginIdsForScope = scope === "all" && expectedPluginIds.length === 0 ? expectedPluginIds : void 0;
	if (!scopedLoad && scopeRank(pluginRegistryLoaded) >= scopeRank(scope) && activeRegistrySatisfiesScope(scope, active, expectedPluginIds, requestedPluginIdsForScope, context.workspaceDir)) return;
	if ((pluginRegistryLoaded === "none" || scopedLoad) && activeRegistrySatisfiesScope(scope, active, expectedPluginIds, requestedPluginIds, context.workspaceDir)) {
		if (!scopedLoad) pluginRegistryLoaded = scope;
		return;
	}
	const scopedConfig = scope === "configured-channels" && expectedPluginIds.length > 0 && (!scopedLoad || requestedChannelOwnerPluginIds !== void 0) ? require_activation_context.withActivatedPluginIds({
		config: context.config,
		pluginIds: expectedPluginIds
	}) ?? context.config : context.config;
	const scopedActivationSourceConfig = scope === "configured-channels" && expectedPluginIds.length > 0 && (!scopedLoad || requestedChannelOwnerPluginIds !== void 0) ? require_activation_context.withActivatedPluginIds({
		config: context.activationSourceConfig,
		pluginIds: expectedPluginIds
	}) ?? context.activationSourceConfig : context.activationSourceConfig;
	resolveOrLoadRuntimePluginRegistry(require_load_context.buildPluginRuntimeLoadOptionsFromValues({
		...context,
		config: scopedConfig,
		activationSourceConfig: scopedActivationSourceConfig
	}, {
		throwOnLoadError: true,
		...require_current_plugin_metadata_snapshot.hasExplicitPluginIdScope(requestedPluginIds) || shouldForwardChannelScope({
			scope,
			scopedLoad
		}) || require_current_plugin_metadata_snapshot.hasNonEmptyPluginIdScope(expectedPluginIds) || scope === "all" ? { onlyPluginIds: expectedPluginIds } : {}
	}));
	if (!scopedLoad) pluginRegistryLoaded = scope;
}
//#endregion
Object.defineProperty(exports, "ensurePluginRegistryLoaded", {
	enumerable: true,
	get: function() {
		return ensurePluginRegistryLoaded;
	}
});
Object.defineProperty(exports, "runtime_registry_loader_exports", {
	enumerable: true,
	get: function() {
		return runtime_registry_loader_exports;
	}
});
