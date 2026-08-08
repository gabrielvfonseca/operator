const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_current_plugin_metadata_snapshot = require("./current-plugin-metadata-snapshot-C2Dl5h_D.cjs");
const require_bundled_compat = require("./bundled-compat-CE2H4H2e.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
//#region src/plugins/activation-context.ts
function withActivatedPluginIds(params) {
	if (params.pluginIds.length === 0) return params.config;
	const originalAllow = params.config?.plugins?.allow ?? [];
	const originalAllowSet = originalAllow.length > 0 ? new Set(originalAllow) : void 0;
	const allow = new Set(originalAllow);
	const entries = { ...params.config?.plugins?.entries };
	for (const pluginId of params.pluginIds) {
		const normalized = pluginId.trim();
		if (!normalized) continue;
		if (originalAllowSet && !originalAllowSet.has(normalized)) continue;
		allow.add(normalized);
		const existingEntry = entries[normalized];
		entries[normalized] = {
			...existingEntry,
			enabled: existingEntry?.enabled !== false || params.overrideExplicitDisable === true
		};
	}
	const forcePluginsEnabled = params.overrideGlobalDisable === true && params.config?.plugins?.enabled === false;
	return {
		...params.config,
		plugins: {
			...params.config?.plugins,
			...forcePluginsEnabled ? { enabled: true } : {},
			...allow.size > 0 ? { allow: [...allow] } : {},
			entries
		}
	};
}
function applyPluginCompatibilityOverrides(params) {
	const enablementCompat = params.compat?.enablementPluginIds?.length ? require_bundled_compat.withBundledPluginEnablementCompat({
		config: params.config,
		pluginIds: params.compat.enablementPluginIds
	}) : params.config;
	return params.compat?.vitestPluginIds?.length ? require_bundled_compat.withBundledPluginVitestCompat({
		config: enablementCompat,
		pluginIds: params.compat.vitestPluginIds,
		env: params.env
	}) : enablementCompat;
}
function shouldResolveBundledCompatPluginIds(params) {
	return params.compatMode.enablement === "always" || params.compatMode.vitest === true;
}
function createBundledPluginCompatConfig(params) {
	return {
		enablementPluginIds: params.compatMode.enablement === "always" ? params.compatPluginIds : void 0,
		vitestPluginIds: params.compatMode.vitest ? params.compatPluginIds : void 0
	};
}
function applyPluginAutoEnableForActivation(params) {
	const currentSnapshot = require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		config: params.config,
		env: params.env,
		workspaceDir: params.workspaceDir,
		allowWorkspaceScopedSnapshot: true
	});
	const defaultDiscoverySnapshot = require_config_state.normalizePluginsConfig(params.config.plugins).loadPaths.length === 0 ? require_current_plugin_metadata_snapshot.getCurrentPluginMetadataSnapshot({
		env: params.env,
		workspaceDir: params.workspaceDir,
		allowWorkspaceScopedSnapshot: true,
		requireDefaultDiscoveryContext: true
	}) : void 0;
	const currentManifestRegistry = currentSnapshot?.manifestRegistry ?? defaultDiscoverySnapshot?.manifestRegistry;
	return require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.config,
		env: params.env,
		manifestRegistry: currentManifestRegistry,
		discovery: params.discovery
	});
}
function resolvePluginActivationSnapshot(params) {
	const env = params.env ?? process.env;
	const rawConfig = params.rawConfig ?? params.resolvedConfig;
	let resolvedConfig = params.resolvedConfig ?? params.rawConfig;
	let autoEnabledReasons = params.autoEnabledReasons;
	if (params.applyAutoEnable && rawConfig !== void 0) {
		const autoEnabled = applyPluginAutoEnableForActivation({
			config: rawConfig,
			env,
			workspaceDir: params.workspaceDir,
			discovery: params.discovery
		});
		resolvedConfig = autoEnabled.config;
		autoEnabledReasons = autoEnabled.autoEnabledReasons;
	}
	return {
		rawConfig,
		config: resolvedConfig,
		normalized: require_config_state.normalizePluginsConfig(resolvedConfig?.plugins),
		activationSourceConfig: rawConfig,
		activationSource: require_config_state.createPluginActivationSource({ config: rawConfig }),
		autoEnabledReasons: autoEnabledReasons ?? {}
	};
}
function resolvePluginActivationInputs(params) {
	const env = params.env ?? process.env;
	const snapshot = resolvePluginActivationSnapshot({
		rawConfig: params.rawConfig,
		resolvedConfig: params.resolvedConfig,
		autoEnabledReasons: params.autoEnabledReasons,
		env,
		workspaceDir: params.workspaceDir,
		applyAutoEnable: params.applyAutoEnable,
		discovery: params.discovery
	});
	const config = applyPluginCompatibilityOverrides({
		config: snapshot.config,
		compat: params.compat,
		env
	});
	return {
		rawConfig: snapshot.rawConfig,
		config,
		normalized: require_config_state.normalizePluginsConfig(config?.plugins),
		activationSourceConfig: snapshot.activationSourceConfig,
		activationSource: snapshot.activationSource,
		autoEnabledReasons: snapshot.autoEnabledReasons
	};
}
function resolveBundledPluginCompatibleActivationInputs(params) {
	const snapshot = resolvePluginActivationSnapshot({
		rawConfig: params.rawConfig,
		resolvedConfig: params.resolvedConfig,
		autoEnabledReasons: params.autoEnabledReasons,
		env: params.env,
		workspaceDir: params.workspaceDir,
		applyAutoEnable: params.applyAutoEnable,
		discovery: params.discovery
	});
	const compatPluginIds = shouldResolveBundledCompatPluginIds({ compatMode: params.compatMode }) ? params.resolveCompatPluginIds({
		config: snapshot.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds
	}) : [];
	return {
		...resolvePluginActivationInputs({
			rawConfig: snapshot.rawConfig,
			resolvedConfig: snapshot.config,
			autoEnabledReasons: snapshot.autoEnabledReasons,
			env: params.env,
			workspaceDir: params.workspaceDir,
			compat: createBundledPluginCompatConfig({
				compatMode: params.compatMode,
				compatPluginIds
			}),
			discovery: params.discovery
		}),
		compatPluginIds
	};
}
function resolveBundledPluginCompatibleLoadValues(params) {
	const env = params.env ?? process.env;
	const rawConfig = params.rawConfig ?? params.resolvedConfig;
	let resolvedConfig = params.resolvedConfig ?? params.rawConfig;
	let autoEnabledReasons = params.autoEnabledReasons ?? {};
	if (params.applyAutoEnable && rawConfig !== void 0) {
		const autoEnabled = applyPluginAutoEnableForActivation({
			config: rawConfig,
			env,
			workspaceDir: params.workspaceDir,
			discovery: params.discovery
		});
		resolvedConfig = autoEnabled.config;
		autoEnabledReasons = autoEnabled.autoEnabledReasons;
	}
	const compatPluginIds = shouldResolveBundledCompatPluginIds({ compatMode: params.compatMode }) ? params.resolveCompatPluginIds({
		config: resolvedConfig,
		workspaceDir: params.workspaceDir,
		env,
		onlyPluginIds: params.onlyPluginIds
	}) : [];
	return {
		rawConfig,
		config: applyPluginCompatibilityOverrides({
			config: resolvedConfig,
			compat: createBundledPluginCompatConfig({
				compatMode: params.compatMode,
				compatPluginIds
			}),
			env
		}),
		activationSourceConfig: rawConfig,
		autoEnabledReasons,
		compatPluginIds
	};
}
//#endregion
Object.defineProperty(exports, "resolveBundledPluginCompatibleActivationInputs", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginCompatibleActivationInputs;
	}
});
Object.defineProperty(exports, "resolveBundledPluginCompatibleLoadValues", {
	enumerable: true,
	get: function() {
		return resolveBundledPluginCompatibleLoadValues;
	}
});
Object.defineProperty(exports, "withActivatedPluginIds", {
	enumerable: true,
	get: function() {
		return withActivatedPluginIds;
	}
});
