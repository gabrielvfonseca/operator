const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_plugin_registry = require("./plugin-registry-qeG97tX7.cjs");
const require_openai_routing = require("./openai-routing-B2l3ny9C.cjs");
const require_policy = require("./policy-DHgMAqLv.cjs");
const require_channel_presence_policy = require("./channel-presence-policy-Cz0v6MJ2.cjs");
const require_providers = require("./providers-MmlTBfO9.cjs");
const require_activation_context = require("./activation-context-BlXZi9Mx.cjs");
const require_model_runtime_aliases = require("./model-runtime-aliases-Cfo8sBOf.cjs");
//#region src/agents/harness/runtime-plugin.ts
var runtime_plugin_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	ensureSelectedAgentHarnessPlugin: () => ensureSelectedAgentHarnessPlugin,
	resolveAgentHarnessOwnerPluginIds: () => resolveAgentHarnessOwnerPluginIds
});
function dedupePluginIds(values) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const value of values) {
		const pluginId = value.trim();
		if (!pluginId || seen.has(pluginId)) continue;
		seen.add(pluginId);
		result.push(pluginId);
	}
	return result;
}
function restrictiveAllowlistOmitsPlugin(config, pluginId) {
	const allow = config?.plugins?.allow ?? [];
	return allow.length > 0 && !allow.includes(pluginId);
}
function resolveSelectedMemoryPluginIds(params) {
	const registry = require_plugin_registry.loadPluginRegistrySnapshot({
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	const plugins = require_plugin_registry.normalizePluginsConfigWithRegistry(params.config?.plugins, registry);
	const memorySlot = plugins.slots.memory;
	if (typeof memorySlot !== "string" || memorySlot.trim().length === 0 || restrictiveAllowlistOmitsPlugin(params.config, memorySlot)) return [];
	const plugin = registry.plugins.find((entry) => entry.pluginId === memorySlot);
	if (!plugin?.startup.memory) return [];
	return require_config_state.resolveEffectivePluginActivationState({
		id: plugin.pluginId,
		origin: plugin.origin,
		config: plugins,
		rootConfig: params.config,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(plugin)
	}).activated ? [plugin.pluginId] : [];
}
/** Resolve manifest owners required by one selected non-core harness runtime. */
function resolveAgentHarnessOwnerPluginIds(params) {
	const harnessPluginIds = require_channel_presence_policy.resolveManifestActivationPlan({
		trigger: {
			kind: "agentHarness",
			runtime: params.runtime
		},
		config: params.config,
		workspaceDir: params.workspaceDir,
		requireExplicitManifestOwnerTrust: true
	}).entries.map((entry) => entry.pluginId);
	if (harnessPluginIds.length === 0) return [];
	if (params.runtime !== "codex") return harnessPluginIds;
	if (!harnessPluginIds.includes("codex")) return harnessPluginIds;
	if (restrictiveAllowlistOmitsPlugin(params.config, "codex")) return harnessPluginIds;
	const providerOwnerPluginIds = dedupePluginIds(require_providers.resolveOwningPluginIdsForProviderRef({
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir
	}) ?? []);
	if (providerOwnerPluginIds.length === 0) return harnessPluginIds;
	const safeProviderOwnerPluginIds = dedupePluginIds([...require_providers.resolveBundledProviderCompatPluginIds({
		config: params.config,
		workspaceDir: params.workspaceDir,
		onlyPluginIds: providerOwnerPluginIds
	}), ...require_providers.resolveActivatableProviderOwnerPluginIds({
		pluginIds: providerOwnerPluginIds,
		config: params.config,
		workspaceDir: params.workspaceDir
	})]);
	return dedupePluginIds([
		"codex",
		...harnessPluginIds,
		...providerOwnerPluginIds.filter((pluginId) => pluginId !== "codex" && safeProviderOwnerPluginIds.includes(pluginId))
	]);
}
function withRuntimePluginIdsAllowed(params) {
	if (params.pluginIds.length === 0) return params.config;
	if (restrictiveAllowlistOmitsPlugin(params.config, params.requiredPluginId)) return params.config;
	const allow = dedupePluginIds([...params.config?.plugins?.allow ?? [], ...params.pluginIds]);
	return {
		...params.config,
		plugins: {
			...params.config?.plugins,
			allow
		}
	};
}
/** Ensures the plugin that owns the selected harness runtime is loaded before harness selection. */
async function ensureSelectedAgentHarnessPlugin(params) {
	const pinnedHarnessId = require_openai_routing.normalizeOptionalAgentRuntimeId(params.agentHarnessId);
	const runtimeOverride = require_openai_routing.normalizeOptionalAgentRuntimeId(params.agentHarnessRuntimeOverride);
	const policy = require_policy.resolveAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.modelId,
		config: params.config,
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		requestTransportOverrides: params.requestTransportOverrides
	});
	const requestedRuntime = pinnedHarnessId ?? runtimeOverride;
	const runtime = requestedRuntime && !require_openai_routing.isDefaultAgentRuntimeId(requestedRuntime) ? requestedRuntime : policy.runtime;
	if (require_openai_routing.isDefaultAgentRuntimeId(runtime) || runtime === "@gabrielvfonseca/operator" || require_model_runtime_aliases.isCliRuntimeAliasForProvider({
		runtime,
		provider: params.provider,
		cfg: params.config
	})) return;
	const { ensurePluginRegistryLoaded } = await Promise.resolve().then(() => require("./runtime-registry-loader-Bm5Oi--4.cjs")).then((n) => n.runtime_registry_loader_exports);
	const pluginIds = resolveAgentHarnessOwnerPluginIds({
		runtime,
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	if (pluginIds.length === 0) return;
	const memoryPluginIds = resolveSelectedMemoryPluginIds({
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	const scopedPluginIds = dedupePluginIds([...pluginIds, ...memoryPluginIds]);
	const configWithAllowedRuntimePlugins = withRuntimePluginIdsAllowed({
		config: params.config,
		requiredPluginId: runtime,
		pluginIds: scopedPluginIds
	});
	const activatedConfig = require_activation_context.withActivatedPluginIds({
		config: configWithAllowedRuntimePlugins,
		pluginIds: scopedPluginIds
	}) ?? configWithAllowedRuntimePlugins;
	ensurePluginRegistryLoaded({
		scope: "all",
		...activatedConfig ? {
			config: activatedConfig,
			activationSourceConfig: activatedConfig
		} : {},
		workspaceDir: params.workspaceDir,
		onlyPluginIds: scopedPluginIds
	});
}
//#endregion
Object.defineProperty(exports, "ensureSelectedAgentHarnessPlugin", {
	enumerable: true,
	get: function() {
		return ensureSelectedAgentHarnessPlugin;
	}
});
Object.defineProperty(exports, "resolveAgentHarnessOwnerPluginIds", {
	enumerable: true,
	get: function() {
		return resolveAgentHarnessOwnerPluginIds;
	}
});
Object.defineProperty(exports, "runtime_plugin_exports", {
	enumerable: true,
	get: function() {
		return runtime_plugin_exports;
	}
});
