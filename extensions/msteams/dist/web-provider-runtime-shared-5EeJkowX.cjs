const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
const require_load_context = require("./load-context-CvRS7akl.cjs");
//#region src/plugins/web-provider-runtime-shared.ts
function resolveWebProviderRuntimeContext(params, deps) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime.getActivePluginRegistryWorkspaceDir();
	const shouldFilterProviders = params.config !== void 0 || params.onlyPluginIds !== void 0 || params.origin !== void 0 || params.sandboxed === true;
	const { config, activationSourceConfig, autoEnabledReasons } = deps.resolveBundledResolutionConfig({
		...params,
		workspaceDir,
		env
	});
	const candidatePluginIds = require_current_plugin_metadata_snapshot.normalizePluginIdScope(deps.resolveCandidatePluginIds({
		config,
		workspaceDir,
		env,
		onlyPluginIds: params.onlyPluginIds,
		origin: params.origin,
		sandboxed: params.sandboxed
	}));
	return {
		activationSourceConfig,
		autoEnabledReasons,
		config,
		env,
		loadPluginIds: candidatePluginIds,
		onlyPluginIds: shouldFilterProviders ? candidatePluginIds : void 0,
		workspaceDir
	};
}
function resolveWebProviderLoadOptions(context, params) {
	return require_load_context.buildPluginRuntimeLoadOptionsFromValues({
		env: context.env,
		config: context.config,
		activationSourceConfig: context.activationSourceConfig,
		autoEnabledReasons: context.autoEnabledReasons,
		workspaceDir: context.workspaceDir,
		logger: require_load_context.createPluginRuntimeLoaderLogger()
	}, {
		cache: params.cache ?? true,
		activate: params.activate ?? false,
		...require_current_plugin_metadata_snapshot.hasExplicitPluginIdScope(context.loadPluginIds) ? { onlyPluginIds: context.loadPluginIds } : {}
	});
}
function resolveRuntimeRegistryWebProviders(params) {
	if (!params.registry) return;
	const providers = params.mapRegistryProviders({
		registry: params.registry,
		onlyPluginIds: params.onlyPluginIds
	});
	return {
		providers,
		shouldReturn: providers.length > 0 || params.hasExplicitEmptyScope
	};
}
/** Resolves plugin web providers from setup, active runtime, or a scoped load. */
function resolvePluginWebProviders(params, deps) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? require_runtime.getActivePluginRegistryWorkspaceDir();
	if (params.mode === "setup") {
		const pluginIds = deps.resolveCandidatePluginIds({
			config: params.config,
			workspaceDir,
			env,
			onlyPluginIds: params.onlyPluginIds,
			origin: params.origin,
			sandboxed: params.sandboxed
		}) ?? [];
		if (pluginIds.length === 0) return [];
		if (params.activate !== true) {
			const bundledArtifactProviders = deps.resolveBundledPublicArtifactProviders?.({
				config: params.config,
				workspaceDir,
				env,
				onlyPluginIds: pluginIds
			});
			if (bundledArtifactProviders) return bundledArtifactProviders;
		}
		const registry = require_loader.loadOperatorPlugins(require_load_context.buildPluginRuntimeLoadOptionsFromValues({
			config: require_activation_context.withActivatedPluginIds({
				config: params.config,
				pluginIds
			}),
			activationSourceConfig: params.config,
			autoEnabledReasons: {},
			workspaceDir,
			env,
			logger: require_load_context.createPluginRuntimeLoaderLogger()
		}, {
			onlyPluginIds: pluginIds,
			cache: params.cache ?? true,
			activate: params.activate ?? false
		}));
		return deps.mapRegistryProviders({
			registry,
			onlyPluginIds: pluginIds
		});
	}
	const context = resolveWebProviderRuntimeContext(params, deps);
	const loadOptions = resolveWebProviderLoadOptions(context, params);
	const compatible = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: context.env,
		loadOptions,
		workspaceDir: context.workspaceDir,
		requiredPluginIds: context.loadPluginIds
	});
	const scopedPluginIds = context.onlyPluginIds;
	const hasExplicitEmptyScope = scopedPluginIds !== void 0 && scopedPluginIds.length === 0;
	const compatibleProviders = resolveRuntimeRegistryWebProviders({
		hasExplicitEmptyScope,
		mapRegistryProviders: deps.mapRegistryProviders,
		onlyPluginIds: context.onlyPluginIds,
		registry: compatible
	});
	if (compatibleProviders?.shouldReturn) return compatibleProviders.providers;
	if (compatibleProviders) {}
	if (require_loader.isPluginRegistryLoadInFlight(loadOptions)) return [];
	if (hasExplicitEmptyScope) return [];
	if (params.activate !== true && context.loadPluginIds && deps.resolveBundledRuntimeArtifactProviders) {
		const bundledArtifactProviders = deps.resolveBundledRuntimeArtifactProviders({
			config: context.config,
			workspaceDir: context.workspaceDir,
			env: context.env,
			onlyPluginIds: context.loadPluginIds
		});
		if (bundledArtifactProviders) return bundledArtifactProviders;
	}
	const registry = require_loader.loadOperatorPlugins(loadOptions);
	return deps.mapRegistryProviders({
		registry,
		onlyPluginIds: context.onlyPluginIds
	});
}
/** Resolves web providers from the active runtime registry before falling back to plugin loading. */
function resolveRuntimeWebProviders(params, deps) {
	const runtimeRegistry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
		env: params.env,
		workspaceDir: params.workspaceDir,
		requiredPluginIds: params.onlyPluginIds
	});
	const runtimeProviders = resolveRuntimeRegistryWebProviders({
		hasExplicitEmptyScope: params.onlyPluginIds !== void 0 && params.onlyPluginIds.length === 0,
		mapRegistryProviders: deps.mapRegistryProviders,
		onlyPluginIds: params.onlyPluginIds,
		registry: runtimeRegistry
	});
	if (runtimeProviders?.shouldReturn) return runtimeProviders.providers;
	return resolvePluginWebProviders(params, deps);
}
//#endregion
Object.defineProperty(exports, "resolvePluginWebProviders", {
	enumerable: true,
	get: function() {
		return resolvePluginWebProviders;
	}
});
Object.defineProperty(exports, "resolveRuntimeWebProviders", {
	enumerable: true,
	get: function() {
		return resolveRuntimeWebProviders;
	}
});
