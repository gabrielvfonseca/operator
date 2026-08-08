require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
require("./registry-B6IZcEYI.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_gateway_startup_plugin_ids = require("./gateway-startup-plugin-ids-COQ5uJcA.cjs");
const require_core_descriptors = require("./core-descriptors-DnvIcTik.cjs");
require("./channel-plugin-ids-CD0w6PY3.cjs");
const require_plugin_lookup_table = require("./plugin-lookup-table-CYK2rClH.cjs");
const require_subagent_registry = require("./subagent-registry-DLykI6PJ.cjs");
const require_plugin_activation_runtime_config = require("./plugin-activation-runtime-config-DgDuUZhx.cjs");
const require_server_methods_list = require("./server-methods-list-DeI5vWB8.cjs");
//#region src/gateway/server-startup-plugins.ts
/** Returns the config snapshot used by channel/plugin startup maintenance. */
function resolveGatewayStartupMaintenanceConfig(params) {
	return params.cfgAtStart.channels === void 0 && params.startupRuntimeConfig.channels !== void 0 ? {
		...params.cfgAtStart,
		channels: params.startupRuntimeConfig.channels
	} : params.cfgAtStart;
}
/** Builds plugin startup state and gateway method lists before the server binds. */
async function prepareGatewayPluginBootstrap(params) {
	const activationSourceConfig = params.activationSourceConfig ?? params.cfgAtStart;
	const startupMaintenanceConfig = resolveGatewayStartupMaintenanceConfig({
		cfgAtStart: params.cfgAtStart,
		startupRuntimeConfig: params.startupRuntimeConfig
	});
	if (!params.minimalTestGateway || startupMaintenanceConfig.channels !== void 0) {
		const { runChannelPluginStartupMaintenance } = await Promise.resolve().then(() => require("./lifecycle-startup-Cv61BB1N.cjs"));
		const startupTasks = [runChannelPluginStartupMaintenance({
			cfg: startupMaintenanceConfig,
			env: process.env,
			log: params.log
		})];
		if (!params.minimalTestGateway) {
			const { runStartupSessionMigration } = await Promise.resolve().then(() => require("./server-startup-session-migration-BZM6vEe4.cjs"));
			startupTasks.push(runStartupSessionMigration({
				cfg: params.cfgAtStart,
				env: process.env,
				log: params.log
			}));
			const { migrateLegacyDevicePairingStore } = await Promise.resolve().then(() => require("./device-pairing-migration-Df_qFYFG.cjs"));
			const { migrateLegacyNodePairingStore } = await Promise.resolve().then(() => require("./node-pairing-migration-xEs1zkBq.cjs"));
			startupTasks.push(migrateLegacyDevicePairingStore({ log: params.log }).then(() => migrateLegacyNodePairingStore({ log: params.log }).then(() => void 0, (error) => {
				params.log.warn(`node pairing store migration failed: ${String(error)}`);
			}), (error) => {
				params.log.warn(`device pairing store migration failed: ${String(error)}`);
			}));
		}
		await Promise.all(startupTasks);
	}
	require_subagent_registry.initSubagentRegistry();
	const gatewayPluginConfig = params.minimalTestGateway ? params.cfgAtStart : require_plugin_activation_runtime_config.resolveGatewayStartupPluginActivationConfig({
		runtimeConfig: params.cfgAtStart,
		activationSourceConfig,
		env: process.env,
		...params.pluginMetadataSnapshot?.manifestRegistry ? { manifestRegistry: params.pluginMetadataSnapshot.manifestRegistry } : {},
		discovery: params.pluginMetadataSnapshot?.discovery
	});
	const pluginsGloballyDisabled = gatewayPluginConfig.plugins?.enabled === false;
	const defaultWorkspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(gatewayPluginConfig, require_agent_scope_config.resolveDefaultAgentId(gatewayPluginConfig));
	const pluginLookUpTable = params.minimalTestGateway || pluginsGloballyDisabled ? void 0 : require_plugin_lookup_table.loadPluginLookUpTable({
		config: gatewayPluginConfig,
		workspaceDir: defaultWorkspaceDir,
		env: process.env,
		activationSourceConfig,
		metadataSnapshot: params.pluginMetadataSnapshot,
		workerProviderIds: params.workerProviderIds ?? []
	});
	const deferredConfiguredChannelPluginIds = [...pluginLookUpTable?.startup.configuredDeferredChannelPluginIds ?? []];
	const startupPluginIds = [...pluginLookUpTable?.startup.pluginIds ?? []];
	const baseMethods = require_server_methods_list.listGatewayMethods();
	const coreGatewayMethodNames = require_core_descriptors.listCoreGatewayMethodNames();
	const emptyPluginRegistry = require_runtime.createEmptyPluginRegistry();
	let pluginRegistry;
	let baseGatewayMethods = baseMethods;
	const shouldLoadRuntimePlugins = params.loadRuntimePlugins !== false;
	const shouldLoadSetupRuntimePlugins = params.loadSetupRuntimePlugins === true && deferredConfiguredChannelPluginIds.length > 0;
	if (!params.minimalTestGateway && shouldLoadSetupRuntimePlugins) ({pluginRegistry, gatewayMethods: baseGatewayMethods} = await loadGatewayStartupPluginRuntime({
		cfg: gatewayPluginConfig,
		activationSourceConfig,
		workspaceDir: defaultWorkspaceDir,
		log: params.log,
		baseMethods,
		coreGatewayMethodNames,
		startupPluginIds: deferredConfiguredChannelPluginIds,
		pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: true,
		suppressPluginInfoLogs: true
	}));
	else if (!params.minimalTestGateway && shouldLoadRuntimePlugins) ({pluginRegistry, gatewayMethods: baseGatewayMethods} = await loadGatewayStartupPluginRuntime({
		cfg: gatewayPluginConfig,
		activationSourceConfig,
		workspaceDir: defaultWorkspaceDir,
		log: params.log,
		baseMethods,
		coreGatewayMethodNames,
		startupPluginIds,
		pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: false,
		suppressPluginInfoLogs: false
	}));
	else {
		pluginRegistry = params.minimalTestGateway ? require_runtime.getActivePluginRegistry() ?? emptyPluginRegistry : emptyPluginRegistry;
		require_runtime.setActivePluginRegistry(pluginRegistry);
	}
	const runtimePluginsLoaded = !params.minimalTestGateway && shouldLoadRuntimePlugins && !shouldLoadSetupRuntimePlugins;
	return {
		gatewayPluginConfigAtStart: gatewayPluginConfig,
		defaultWorkspaceDir,
		deferredConfiguredChannelPluginIds,
		startupPluginIds,
		pluginLookUpTable,
		baseMethods,
		pluginRegistry,
		baseGatewayMethods,
		runtimePluginsLoaded
	};
}
/**
* Warn when `agents.*.memorySearch.provider` selects a memory embedding provider
* that no loaded plugin registered. Without the owning plugin, `active-memory`
* cannot embed and silently falls back to keyword/FTS-only recall.
*/
function warnUnregisteredConfiguredMemoryEmbeddingProviders(params) {
	const unregistered = require_gateway_startup_plugin_ids.collectUnregisteredConfiguredMemoryEmbeddingProviders({
		config: params.config,
		registeredProviderIds: require_gateway_startup_plugin_ids.collectRegisteredEmbeddingProviderIds(params.pluginRegistry)
	});
	for (const provider of unregistered) {
		const path = `memorySearch.${provider.source}`;
		params.log.warn(`${path}="${provider.configuredId}" is configured, but no loaded plugin registered a memory embedding provider that can serve "${provider.configuredId}". Semantic memory recall will fall back to keyword/FTS-only search. Ensure the plugin that provides "${provider.configuredId}" is installed and enabled.`);
	}
}
/** Loads startup plugin runtimes through the deferred bootstrap boundary. */
async function loadGatewayStartupPluginRuntime(params) {
	const { loadGatewayStartupPlugins } = await Promise.resolve().then(() => require("./server-plugin-bootstrap-DVP2HykM.cjs"));
	const loaded = loadGatewayStartupPlugins({
		cfg: params.cfg,
		activationSourceConfig: params.activationSourceConfig,
		workspaceDir: params.workspaceDir,
		log: params.log,
		coreGatewayMethodNames: params.coreGatewayMethodNames ?? params.baseMethods,
		baseMethods: params.baseMethods,
		...params.hostServices !== void 0 && { hostServices: params.hostServices },
		pluginIds: params.startupPluginIds,
		pluginLookUpTable: params.pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: params.preferSetupRuntimeForChannelPlugins,
		suppressPluginInfoLogs: params.suppressPluginInfoLogs,
		startupTrace: params.startupTrace
	});
	if (params.preferSetupRuntimeForChannelPlugins !== true) warnUnregisteredConfiguredMemoryEmbeddingProviders({
		config: params.cfg,
		pluginRegistry: loaded.pluginRegistry,
		log: params.log
	});
	return loaded;
}
//#endregion
exports.loadGatewayStartupPluginRuntime = loadGatewayStartupPluginRuntime;
exports.prepareGatewayPluginBootstrap = prepareGatewayPluginBootstrap;
exports.resolveGatewayStartupMaintenanceConfig = resolveGatewayStartupMaintenanceConfig;
exports.warnUnregisteredConfiguredMemoryEmbeddingProviders = warnUnregisteredConfiguredMemoryEmbeddingProviders;
