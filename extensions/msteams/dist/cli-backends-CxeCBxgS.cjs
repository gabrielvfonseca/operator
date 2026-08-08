const require_cli_backends_runtime = require("./cli-backends.runtime-BVsK1-34.cjs");
const require_setup_registry = require("./setup-registry-bM3fH6vu.cjs");
const require_text_transforms_runtime = require("./text-transforms.runtime-B0pRaBUe.cjs");
let _gabrielvfonseca_model_catalog_core_provider_id = require("@gabrielvfonseca/model-catalog-core/provider-id");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/cli-backends.ts
/**
* Resolves CLI runtime backends registered by plugins or setup metadata.
*/
const defaultCliBackendsDeps = {
	resolvePluginSetupCliBackend: require_setup_registry.resolvePluginSetupCliBackend,
	resolvePluginSetupRegistry: require_setup_registry.resolvePluginSetupRegistry,
	resolveRuntimeCliBackends: require_cli_backends_runtime.resolveRuntimeCliBackends
};
let cliBackendsDeps = defaultCliBackendsDeps;
const FALLBACK_CLI_BACKEND_POLICIES = {};
function normalizeBundleMcpMode(mode, enabled) {
	if (!enabled) return;
	return mode ?? "claude-config-file";
}
function resolveSetupCliBackendPolicy(provider) {
	const entry = cliBackendsDeps.resolvePluginSetupCliBackend({ backend: provider });
	if (!entry) return;
	return {
		bundleMcp: entry.backend.bundleMcp === true,
		modelProvider: resolveCliBackendModelProvider(entry.backend),
		bundleMcpMode: normalizeBundleMcpMode(entry.backend.bundleMcpMode, entry.backend.bundleMcp === true),
		baseConfig: entry.backend.config,
		normalizeConfig: entry.backend.normalizeConfig,
		transformSystemPrompt: entry.backend.transformSystemPrompt,
		textTransforms: entry.backend.textTransforms,
		defaultAuthProfileId: entry.backend.defaultAuthProfileId,
		authEpochMode: entry.backend.authEpochMode,
		autoSelectAuthProfile: entry.backend.autoSelectAuthProfile,
		contextEngineHostCapabilities: entry.backend.contextEngineHostCapabilities,
		ownsNativeCompaction: entry.backend.ownsNativeCompaction,
		prepareExecution: entry.backend.prepareExecution,
		resolveExecutionArgs: entry.backend.resolveExecutionArgs,
		nativeToolMode: entry.backend.nativeToolMode,
		sideQuestionToolMode: entry.backend.sideQuestionToolMode,
		runtimeArtifact: entry.backend.runtimeArtifact
	};
}
function resolveFallbackCliBackendPolicy(provider) {
	return FALLBACK_CLI_BACKEND_POLICIES[provider] ?? resolveSetupCliBackendPolicy(provider);
}
function normalizeBackendKey(key) {
	return (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(key);
}
function pickBackendConfig(config, normalizedId) {
	const directKey = Object.keys(config).find((key) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(key) === normalizedId);
	if (directKey) return config[directKey];
	for (const [key, entry] of Object.entries(config)) if (normalizeBackendKey(key) === normalizedId) return entry;
}
function resolveRegisteredBackend(provider) {
	const normalized = normalizeBackendKey(provider);
	return cliBackendsDeps.resolveRuntimeCliBackends().find((entry) => normalizeBackendKey(entry.id) === normalized);
}
function resolveCliBackendModelProvider(backend) {
	const provider = backend.modelProvider?.trim();
	return provider ? (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(provider) : void 0;
}
function addCliRuntimeModelBinding(bindings, params) {
	const provider = resolveCliBackendModelProvider(params.backend);
	const runtime = normalizeBackendKey(params.backend.id);
	if (!provider || !runtime) return;
	bindings.set(`${provider}:${runtime}`, {
		provider,
		runtime,
		...params.pluginId ? { pluginId: params.pluginId } : {}
	});
}
/** Lists model-provider to CLI-runtime bindings from runtime and optional setup registries. */
function listCliRuntimeModelBackendBindings(params = {}) {
	const bindings = /* @__PURE__ */ new Map();
	for (const backend of cliBackendsDeps.resolveRuntimeCliBackends()) addCliRuntimeModelBinding(bindings, {
		backend,
		...backend.pluginId ? { pluginId: backend.pluginId } : {}
	});
	if (params.includeSetupRegistry === true) for (const entry of cliBackendsDeps.resolvePluginSetupRegistry({
		config: params.config,
		env: params.env
	}).cliBackends) addCliRuntimeModelBinding(bindings, {
		backend: entry.backend,
		pluginId: entry.pluginId
	});
	return [...bindings.values()].toSorted((left, right) => left.provider === right.provider ? left.runtime.localeCompare(right.runtime) : left.provider.localeCompare(right.provider));
}
/** Lists CLI runtime ids that alias canonical model providers. */
function listCliRuntimeProviderIds(params = {}) {
	return [...new Set(listCliRuntimeModelBackendBindings(params).map((binding) => normalizeBackendKey(binding.runtime)).filter(Boolean))].toSorted();
}
/** Resolves the canonical model provider served by a CLI runtime id. */
function resolveCliRuntimeCanonicalProvider(params) {
	const runtime = normalizeBackendKey(params.runtime ?? "");
	if (!runtime) return;
	const runtimeBinding = listCliRuntimeModelBackendBindings().find((binding) => binding.runtime === runtime);
	if (runtimeBinding) return runtimeBinding.provider;
	if (params.includeSetupRegistry !== true) return;
	const setupBackend = cliBackendsDeps.resolvePluginSetupCliBackend({
		backend: runtime,
		config: params.config,
		env: params.env
	});
	return setupBackend ? resolveCliBackendModelProvider(setupBackend.backend) : void 0;
}
/** Resolves the binding for one provider/runtime pair when registered. */
function resolveCliRuntimeModelBackendBinding(params) {
	const provider = (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(params.provider ?? "");
	const runtime = normalizeBackendKey(params.runtime ?? "");
	if (!provider || !runtime) return;
	const runtimeBinding = listCliRuntimeModelBackendBindings().find((binding) => binding.provider === provider && binding.runtime === runtime);
	if (runtimeBinding) return runtimeBinding;
	if (!(params.config !== void 0 || params.env !== void 0)) return;
	const setupBackend = cliBackendsDeps.resolvePluginSetupCliBackend({
		backend: runtime,
		config: params.config,
		env: params.env
	});
	if (!setupBackend) return;
	return resolveCliBackendModelProvider(setupBackend.backend) === provider ? {
		provider,
		runtime,
		...setupBackend.pluginId ? { pluginId: setupBackend.pluginId } : {}
	} : void 0;
}
/** Checks whether a runtime is registered to serve a model provider. */
function isCliRuntimeModelBackendForProvider(params) {
	return resolveCliRuntimeModelBackendBinding(params) !== void 0;
}
function mergeBackendConfig(base, override) {
	if (!override) return { ...base };
	const baseFresh = base.reliability?.watchdog?.fresh ?? {};
	const baseResume = base.reliability?.watchdog?.resume ?? {};
	const baseOutputLimits = base.reliability?.outputLimits ?? {};
	const overrideFresh = override.reliability?.watchdog?.fresh ?? {};
	const overrideResume = override.reliability?.watchdog?.resume ?? {};
	const overrideOutputLimits = override.reliability?.outputLimits ?? {};
	return {
		...base,
		...override,
		args: override.args ?? base.args,
		env: {
			...base.env,
			...override.env
		},
		modelAliases: {
			...base.modelAliases,
			...override.modelAliases
		},
		clearEnv: (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueStrings)([...base.clearEnv ?? [], ...override.clearEnv ?? []]),
		sessionIdFields: override.sessionIdFields ?? base.sessionIdFields,
		sessionArgs: override.sessionArgs ?? base.sessionArgs,
		resumeArgs: override.resumeArgs ?? base.resumeArgs,
		reliability: {
			...base.reliability,
			...override.reliability,
			outputLimits: {
				...baseOutputLimits,
				...overrideOutputLimits
			},
			watchdog: {
				...base.reliability?.watchdog,
				...override.reliability?.watchdog,
				fresh: {
					...baseFresh,
					...overrideFresh
				},
				resume: {
					...baseResume,
					...overrideResume
				}
			}
		}
	};
}
/** Resolves the executable CLI backend config after plugin defaults and user overrides. */
function resolveCliBackendConfig(provider, cfg, options = {}) {
	const normalized = normalizeBackendKey(provider);
	const normalizeContext = {
		backendId: normalized,
		...options.agentId ? { agentId: options.agentId } : {},
		...cfg ? { config: cfg } : {}
	};
	const runtimeTextTransforms = require_text_transforms_runtime.resolveRuntimeTextTransforms();
	const override = pickBackendConfig(cfg?.agents?.defaults?.cliBackends ?? {}, normalized);
	const registered = resolveRegisteredBackend(normalized);
	if (registered) {
		const merged = mergeBackendConfig(registered.config, override);
		const config = registered.normalizeConfig ? registered.normalizeConfig(merged, normalizeContext) : merged;
		const command = config.command?.trim();
		if (!command) return null;
		return {
			id: normalized,
			...registered.modelProvider ? { modelProvider: (0, _gabrielvfonseca_model_catalog_core_provider_id.normalizeProviderId)(registered.modelProvider) } : {},
			config: {
				...config,
				command
			},
			bundleMcp: registered.bundleMcp === true,
			bundleMcpMode: normalizeBundleMcpMode(registered.bundleMcpMode, registered.bundleMcp === true),
			pluginId: registered.pluginId,
			transformSystemPrompt: registered.transformSystemPrompt,
			textTransforms: require_text_transforms_runtime.mergePluginTextTransforms(runtimeTextTransforms, registered.textTransforms),
			defaultAuthProfileId: registered.defaultAuthProfileId,
			authEpochMode: registered.authEpochMode,
			autoSelectAuthProfile: registered.autoSelectAuthProfile,
			contextEngineHostCapabilities: registered.contextEngineHostCapabilities,
			ownsNativeCompaction: registered.ownsNativeCompaction,
			prepareExecution: registered.prepareExecution,
			resolveExecutionArgs: registered.resolveExecutionArgs,
			nativeToolMode: registered.nativeToolMode,
			sideQuestionToolMode: registered.sideQuestionToolMode,
			runtimeArtifact: registered.runtimeArtifact
		};
	}
	const fallbackPolicy = resolveFallbackCliBackendPolicy(normalized);
	if (!override) {
		if (!fallbackPolicy?.baseConfig) return null;
		const baseConfig = fallbackPolicy.normalizeConfig ? fallbackPolicy.normalizeConfig(fallbackPolicy.baseConfig, normalizeContext) : fallbackPolicy.baseConfig;
		const command = baseConfig.command?.trim();
		if (!command) return null;
		return {
			id: normalized,
			...fallbackPolicy.modelProvider ? { modelProvider: fallbackPolicy.modelProvider } : {},
			config: {
				...baseConfig,
				command
			},
			bundleMcp: fallbackPolicy.bundleMcp,
			bundleMcpMode: fallbackPolicy.bundleMcpMode,
			transformSystemPrompt: fallbackPolicy.transformSystemPrompt,
			textTransforms: require_text_transforms_runtime.mergePluginTextTransforms(runtimeTextTransforms, fallbackPolicy.textTransforms),
			defaultAuthProfileId: fallbackPolicy.defaultAuthProfileId,
			authEpochMode: fallbackPolicy.authEpochMode,
			autoSelectAuthProfile: fallbackPolicy.autoSelectAuthProfile,
			contextEngineHostCapabilities: fallbackPolicy.contextEngineHostCapabilities,
			ownsNativeCompaction: fallbackPolicy.ownsNativeCompaction,
			prepareExecution: fallbackPolicy.prepareExecution,
			resolveExecutionArgs: fallbackPolicy.resolveExecutionArgs,
			nativeToolMode: fallbackPolicy.nativeToolMode,
			sideQuestionToolMode: fallbackPolicy.sideQuestionToolMode,
			runtimeArtifact: fallbackPolicy.runtimeArtifact
		};
	}
	const mergedFallback = fallbackPolicy?.baseConfig ? mergeBackendConfig(fallbackPolicy.baseConfig, override) : override;
	const config = fallbackPolicy?.normalizeConfig ? fallbackPolicy.normalizeConfig(mergedFallback, normalizeContext) : mergedFallback;
	const command = config.command?.trim();
	if (!command) return null;
	return {
		id: normalized,
		...fallbackPolicy?.modelProvider ? { modelProvider: fallbackPolicy.modelProvider } : {},
		config: {
			...config,
			command
		},
		bundleMcp: fallbackPolicy?.bundleMcp === true,
		bundleMcpMode: fallbackPolicy?.bundleMcpMode,
		transformSystemPrompt: fallbackPolicy?.transformSystemPrompt,
		textTransforms: require_text_transforms_runtime.mergePluginTextTransforms(runtimeTextTransforms, fallbackPolicy?.textTransforms),
		defaultAuthProfileId: fallbackPolicy?.defaultAuthProfileId,
		authEpochMode: fallbackPolicy?.authEpochMode,
		autoSelectAuthProfile: fallbackPolicy?.autoSelectAuthProfile,
		contextEngineHostCapabilities: fallbackPolicy?.contextEngineHostCapabilities,
		ownsNativeCompaction: fallbackPolicy?.ownsNativeCompaction,
		prepareExecution: fallbackPolicy?.prepareExecution,
		resolveExecutionArgs: fallbackPolicy?.resolveExecutionArgs,
		nativeToolMode: fallbackPolicy?.nativeToolMode,
		sideQuestionToolMode: fallbackPolicy?.sideQuestionToolMode,
		runtimeArtifact: fallbackPolicy?.runtimeArtifact
	};
}
/** Test-only dependency controls for CLI backend registry resolution. */
const testing = {
	resetDepsForTest() {
		cliBackendsDeps = defaultCliBackendsDeps;
	},
	setDepsForTest(deps) {
		cliBackendsDeps = {
			...defaultCliBackendsDeps,
			...deps
		};
	}
};
if (process.env.VITEST || false) globalThis[Symbol.for("operator.cliBackendsTestApi")] = testing;
//#endregion
Object.defineProperty(exports, "isCliRuntimeModelBackendForProvider", {
	enumerable: true,
	get: function() {
		return isCliRuntimeModelBackendForProvider;
	}
});
Object.defineProperty(exports, "listCliRuntimeModelBackendBindings", {
	enumerable: true,
	get: function() {
		return listCliRuntimeModelBackendBindings;
	}
});
Object.defineProperty(exports, "listCliRuntimeProviderIds", {
	enumerable: true,
	get: function() {
		return listCliRuntimeProviderIds;
	}
});
Object.defineProperty(exports, "resolveCliBackendConfig", {
	enumerable: true,
	get: function() {
		return resolveCliBackendConfig;
	}
});
Object.defineProperty(exports, "resolveCliRuntimeCanonicalProvider", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeCanonicalProvider;
	}
});
Object.defineProperty(exports, "resolveCliRuntimeModelBackendBinding", {
	enumerable: true,
	get: function() {
		return resolveCliRuntimeModelBackendBinding;
	}
});
