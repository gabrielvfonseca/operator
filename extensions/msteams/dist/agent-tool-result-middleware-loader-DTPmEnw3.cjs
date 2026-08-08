require("./rolldown-runtime-u92d-OFm.cjs");
const require_subsystem = require("./subsystem-DVRgVNGQ.cjs");
const require_config_state = require("./config-state-HZqFhERk.cjs");
const require_default_enablement = require("./default-enablement-ClBEzpPw.cjs");
const require_manifest_registry = require("./manifest-registry-CBh34U5K.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_agent_tool_result_middleware = require("./agent-tool-result-middleware-Do5BE8dK.cjs");
const require_active_runtime_registry = require("./active-runtime-registry-DYBE_-EX.cjs");
//#region src/plugins/agent-tool-result-middleware-loader.ts
const log = require_subsystem.createSubsystemLogger("plugins/agent-tool-result-middleware");
async function resolveRuntimeConfigContext() {
	const { getRuntimeConfig, getRuntimeConfigSourceSnapshot } = await Promise.resolve().then(() => require("./config-DT0qiglW.cjs")).then((n) => n.config_exports);
	const config = getRuntimeConfig();
	return {
		config,
		activationSourceConfig: getRuntimeConfigSourceSnapshot() ?? config
	};
}
function listMiddlewareOwnerPluginIds(params) {
	const pluginIds = [];
	for (const record of params.manifestRegistry.plugins) {
		if (!canLazyLoadMiddlewareOwner({
			record,
			config: params.config,
			pluginsConfig: params.pluginsConfig,
			activationSource: params.activationSource
		})) continue;
		if (require_agent_tool_result_middleware.normalizeAgentToolResultMiddlewareRuntimeIds(record.contracts?.agentToolResultMiddleware).includes(params.runtime) && !pluginIds.includes(record.id)) pluginIds.push(record.id);
	}
	return pluginIds;
}
function canLazyLoadMiddlewareOwner(params) {
	if (params.record.origin === "bundled") return true;
	const activationState = require_config_state.resolveEffectivePluginActivationState({
		id: params.record.id,
		origin: params.record.origin,
		config: params.pluginsConfig,
		rootConfig: params.config,
		enabledByDefault: require_default_enablement.isPluginEnabledByDefaultForPlatform(params.record),
		activationSource: params.activationSource
	});
	return activationState.enabled && activationState.explicitlyEnabled;
}
function listRuntimeMiddlewareOwnerPluginIds(registry, runtime) {
	const pluginIds = /* @__PURE__ */ new Set();
	for (const entry of registry?.agentToolResultMiddlewares ?? []) if (entry.runtimes.includes(runtime)) pluginIds.add(entry.pluginId);
	return pluginIds;
}
function listActiveMiddlewareOwnerPluginIds(runtime) {
	return listRuntimeMiddlewareOwnerPluginIds(require_runtime.getActivePluginRegistry(), runtime);
}
function registryHasMiddlewareOwners(params) {
	if (!params.registry) return false;
	const ownerPluginIds = listRuntimeMiddlewareOwnerPluginIds(params.registry, params.runtime);
	return params.pluginIds.every((pluginId) => ownerPluginIds.has(pluginId));
}
async function loadAgentToolResultMiddlewaresForRuntime(params) {
	const activeHandlers = require_agent_tool_result_middleware.listAgentToolResultMiddlewares(params.runtime);
	try {
		const runtimeContext = params.config ? {
			config: params.config,
			activationSourceConfig: params.config
		} : await resolveRuntimeConfigContext();
		const config = runtimeContext.config;
		const activationSourceConfig = params.activationSourceConfig ?? runtimeContext.activationSourceConfig;
		const env = params.env ?? process.env;
		const manifestRegistry = params.manifestRegistry ?? require_manifest_registry.loadPluginManifestRegistry({
			config,
			workspaceDir: params.workspaceDir,
			env
		});
		const pluginsConfig = require_config_state.normalizePluginsConfig(config.plugins);
		const activationSource = require_config_state.createPluginActivationSource({
			config: activationSourceConfig,
			plugins: require_config_state.normalizePluginsConfig(activationSourceConfig.plugins)
		});
		const pluginIds = listMiddlewareOwnerPluginIds({
			manifestRegistry,
			runtime: params.runtime,
			config,
			pluginsConfig,
			activationSource
		});
		if (pluginIds.length === 0) return activeHandlers;
		const activePluginIds = listActiveMiddlewareOwnerPluginIds(params.runtime);
		const missingPluginIds = pluginIds.filter((pluginId) => !activePluginIds.has(pluginId));
		if (missingPluginIds.length === 0) return activeHandlers;
		const missingPluginIdSet = new Set(missingPluginIds);
		const loadedRegistry = require_active_runtime_registry.getLoadedRuntimePluginRegistry({
			workspaceDir: params.workspaceDir,
			env,
			requiredPluginIds: missingPluginIds
		});
		const missingHandlers = (loadedRegistry && registryHasMiddlewareOwners({
			registry: loadedRegistry,
			pluginIds: missingPluginIds,
			runtime: params.runtime
		}) ? loadedRegistry : require_loader.loadOperatorPlugins({
			config,
			workspaceDir: params.workspaceDir,
			env,
			onlyPluginIds: missingPluginIds,
			manifestRegistry,
			activate: false,
			forceFullRuntimeForChannelPlugins: true
		})).agentToolResultMiddlewares.filter((entry) => missingPluginIdSet.has(entry.pluginId) && entry.runtimes.includes(params.runtime)).map((entry) => entry.handler);
		return [...activeHandlers, ...missingHandlers];
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		log.warn(`[${params.runtime}] failed to load tool result middleware plugins: ${detail}`);
		return require_agent_tool_result_middleware.listAgentToolResultMiddlewares(params.runtime);
	}
}
//#endregion
exports.loadAgentToolResultMiddlewaresForRuntime = loadAgentToolResultMiddlewaresForRuntime;
