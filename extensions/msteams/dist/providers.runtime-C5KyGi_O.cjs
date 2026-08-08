const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_installed_plugin_index = require("./installed-plugin-index-DAAGKjaY.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_plugin_metadata_snapshot = require("./plugin-metadata-snapshot-dWX6LXOP.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/providers.runtime.ts
var providers_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	isPluginProvidersLoadInFlight: () => isPluginProvidersLoadInFlight,
	resolvePluginProviders: () => resolvePluginProviders
});
function resolveExplicitProviderOwnerPluginIds(params, snapshot) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)(params.providerRefs.flatMap((provider) => {
		const plannedPluginIds = require_channel_presence_policy.resolveManifestActivationPluginIds({
			trigger: {
				kind: "provider",
				provider
			},
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			manifestRecords: snapshot.manifestRegistry.plugins
		});
		if (plannedPluginIds.length > 0) return plannedPluginIds;
		const apiOwnerHint = require_gateway_startup_plugin_ids.resolveProviderConfigApiOwnerHint({
			provider,
			config: params.config
		});
		if (apiOwnerHint) {
			const apiOwnerPluginIds = require_channel_presence_policy.resolveManifestActivationPluginIds({
				trigger: {
					kind: "provider",
					provider: apiOwnerHint
				},
				config: params.config,
				workspaceDir: params.workspaceDir,
				env: params.env,
				manifestRecords: snapshot.manifestRegistry.plugins
			});
			if (apiOwnerPluginIds.length > 0) return apiOwnerPluginIds;
		}
		return require_providers.resolveOwningPluginIdsForProviderRef({
			provider,
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			manifestRegistry: snapshot.manifestRegistry
		}) ?? [];
	}));
}
function mergeExplicitOwnerPluginIds(providerPluginIds, explicitOwnerPluginIds) {
	if (explicitOwnerPluginIds.length === 0) return [...providerPluginIds];
	return (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...providerPluginIds, ...explicitOwnerPluginIds]);
}
function resolvePluginProviderLoadBase(params, snapshot) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime.getActivePluginRegistryWorkspaceDir();
	const providerOwnedPluginIds = params.providerRefs?.length ? resolveExplicitProviderOwnerPluginIds({
		providerRefs: params.providerRefs,
		config: params.config,
		workspaceDir,
		env
	}, snapshot) : [];
	const modelOwnedPluginIds = params.modelRefs?.length ? require_providers.resolveOwningPluginIdsForModelRefs({
		models: params.modelRefs,
		config: params.config,
		workspaceDir,
		env,
		manifestRegistry: snapshot.manifestRegistry
	}) : [];
	return {
		env,
		workspaceDir,
		requestedPluginIds: require_current_plugin_metadata_snapshot.hasExplicitPluginIdScope(params.onlyPluginIds) || params.providerRefs?.length || params.modelRefs?.length || providerOwnedPluginIds.length > 0 || modelOwnedPluginIds.length > 0 ? (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([
			...params.onlyPluginIds ?? [],
			...providerOwnedPluginIds,
			...modelOwnedPluginIds
		]) : void 0,
		explicitOwnerPluginIds: (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...providerOwnedPluginIds, ...modelOwnedPluginIds]),
		rawConfig: params.config
	};
}
function resolveProviderMetadataLookup(params) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime.getActivePluginRegistryWorkspaceDir();
	return {
		env,
		workspaceDir,
		snapshot: params.pluginMetadataSnapshot ?? require_plugin_metadata_snapshot.resolvePluginMetadataSnapshot({
			config: params.config ?? {},
			workspaceDir,
			env
		})
	};
}
function resolveSetupProviderPluginLoadState(params, base, snapshot) {
	const setupPluginIds = mergeExplicitOwnerPluginIds(require_providers.resolveDiscoveredProviderPluginIds({
		config: params.config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		onlyPluginIds: base.requestedPluginIds,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}), require_providers.resolveDiscoverableProviderOwnerPluginIds({
		pluginIds: base.explicitOwnerPluginIds,
		config: params.config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}));
	if (setupPluginIds.length === 0) return;
	const setupConfig = require_activation_context.withActivatedPluginIds({
		config: base.rawConfig,
		pluginIds: setupPluginIds
	});
	return { loadOptions: require_load_context.buildPluginRuntimeLoadOptionsFromValues({
		config: setupConfig,
		activationSourceConfig: setupConfig,
		autoEnabledReasons: {},
		workspaceDir: base.workspaceDir,
		env: base.env,
		logger: require_load_context.createPluginRuntimeLoaderLogger(),
		manifestRegistry: snapshot.manifestRegistry,
		installRecords: require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(snapshot.index)
	}, {
		onlyPluginIds: setupPluginIds,
		pluginSdkResolution: params.pluginSdkResolution,
		cache: params.cache ?? false,
		activate: params.activate ?? false
	}) };
}
function resolveRuntimeProviderPluginLoadState(params, base, snapshot) {
	const explicitOwnerPluginIds = require_providers.resolveActivatableProviderOwnerPluginIds({
		pluginIds: base.explicitOwnerPluginIds,
		config: base.rawConfig,
		workspaceDir: base.workspaceDir,
		env: base.env,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	});
	const runtimeRequestedPluginIds = base.requestedPluginIds !== void 0 ? (0, _gabrielvfonseca_normalization_core_string_normalization.sortUniqueStrings)([...params.onlyPluginIds ?? [], ...explicitOwnerPluginIds]) : void 0;
	const activation = require_activation_context.resolveBundledPluginCompatibleActivationInputs({
		rawConfig: require_activation_context.withActivatedPluginIds({
			config: base.rawConfig,
			pluginIds: explicitOwnerPluginIds
		}),
		env: base.env,
		workspaceDir: base.workspaceDir,
		onlyPluginIds: runtimeRequestedPluginIds,
		applyAutoEnable: params.applyAutoEnable ?? true,
		compatMode: { vitest: params.bundledProviderVitestCompat },
		resolveCompatPluginIds: (compatParams) => require_providers.resolveBundledProviderCompatPluginIds({
			...compatParams,
			manifestRegistry: snapshot.manifestRegistry
		})
	});
	const config = params.bundledProviderVitestCompat ? require_providers.withBundledProviderVitestCompat({
		config: activation.config,
		pluginIds: activation.compatPluginIds,
		env: base.env
	}) : activation.config;
	const providerPluginIds = mergeExplicitOwnerPluginIds(require_providers.resolveEnabledProviderPluginIds({
		config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		onlyPluginIds: runtimeRequestedPluginIds,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}), explicitOwnerPluginIds);
	return { loadOptions: require_load_context.buildPluginRuntimeLoadOptionsFromValues({
		config,
		activationSourceConfig: activation.activationSourceConfig,
		autoEnabledReasons: activation.autoEnabledReasons,
		workspaceDir: base.workspaceDir,
		env: base.env,
		logger: require_load_context.createPluginRuntimeLoaderLogger(),
		manifestRegistry: snapshot.manifestRegistry,
		installRecords: require_installed_plugin_index.extractPluginInstallRecordsFromInstalledPluginIndex(snapshot.index)
	}, {
		onlyPluginIds: providerPluginIds,
		pluginSdkResolution: params.pluginSdkResolution,
		cache: params.cache ?? true,
		activate: params.activate ?? false
	}) };
}
function isPluginProvidersLoadInFlight(params) {
	const { env, workspaceDir, snapshot } = resolveProviderMetadataLookup(params);
	const base = resolvePluginProviderLoadBase({
		...params,
		workspaceDir,
		env
	}, snapshot);
	const loadState = params.mode === "setup" ? resolveSetupProviderPluginLoadState(params, base, snapshot) : resolveRuntimeProviderPluginLoadState(params, base, snapshot);
	if (!loadState) return false;
	return require_loader.isPluginRegistryLoadInFlight(loadState.loadOptions);
}
function resolvePluginProviders(params) {
	const { env, workspaceDir, snapshot } = resolveProviderMetadataLookup(params);
	const base = resolvePluginProviderLoadBase({
		...params,
		workspaceDir,
		env
	}, snapshot);
	if (params.mode === "setup") {
		const loadState = resolveSetupProviderPluginLoadState(params, base, snapshot);
		if (!loadState) return [];
		if (params.skipIfLoadInFlight && require_loader.isPluginRegistryLoadInFlight(loadState.loadOptions)) return [];
		return require_loader.loadOperatorPlugins(loadState.loadOptions).providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
	}
	const loadState = resolveRuntimeProviderPluginLoadState(params, base, snapshot);
	if (params.skipIfLoadInFlight && require_loader.isPluginRegistryLoadInFlight(loadState.loadOptions)) return [];
	const registry = loadState.loadOptions.onlyPluginIds?.length === 0 ? void 0 : require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: base.env,
		loadOptions: loadState.loadOptions,
		workspaceDir: base.workspaceDir,
		requiredPluginIds: loadState.loadOptions.onlyPluginIds
	}) ?? require_loader.getRuntimePluginRegistryForLoadOptions(loadState.loadOptions);
	if (!registry) return [];
	return registry.providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
}
//#endregion
Object.defineProperty(exports, "isPluginProvidersLoadInFlight", {
	enumerable: true,
	get: function() {
		return isPluginProvidersLoadInFlight;
	}
});
Object.defineProperty(exports, "providers_runtime_exports", {
	enumerable: true,
	get: function() {
		return providers_runtime_exports;
	}
});
Object.defineProperty(exports, "resolvePluginProviders", {
	enumerable: true,
	get: function() {
		return resolvePluginProviders;
	}
});
