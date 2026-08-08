require("./rolldown-runtime-u92d-OFm.cjs");
const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
const require_binding_registry = require("./binding-registry-CtJxOm6I.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_worker_provider_registry = require("./worker-provider-registry-CsuKJchR.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
const require_server_plugins = require("./server-plugins-Dy_TV4O_.cjs");
const require_plugin_activation_runtime_config = require("./plugin-activation-runtime-config-DgDuUZhx.cjs");
//#region src/plugins/runtime/gateway-bindings.ts
const GATEWAY_SUBAGENT_SYMBOL = Symbol.for("operator.plugin.gatewaySubagentRuntime");
const gatewaySubagentState = require_global_singleton.resolveGlobalSingleton(GATEWAY_SUBAGENT_SYMBOL, () => ({
	subagent: void 0,
	nodes: void 0
}));
/**
* Set the process-global gateway subagent runtime.
* Called during gateway startup so that gateway-bindable plugin runtimes can
* resolve subagent methods dynamically even when their registry was cached
* before the gateway finished loading plugins.
*/
function setGatewaySubagentRuntime(subagent) {
	gatewaySubagentState.subagent = subagent;
}
function setGatewayNodesRuntime(nodes) {
	gatewaySubagentState.nodes = nodes;
}
//#endregion
//#region src/gateway/server-plugin-bootstrap.ts
function installGatewayPluginRuntimeEnvironment(cfg) {
	require_server_plugins.setPluginSubagentOverridePolicies(cfg);
	setGatewaySubagentRuntime(require_server_plugins.createGatewaySubagentRuntime());
	setGatewayNodesRuntime(require_server_plugins.createGatewayNodesRuntime());
}
function pinGatewayPluginRuntimeRegistries(pluginRegistry) {
	require_runtime.pinActivePluginChannelRegistry(pluginRegistry);
	require_runtime.pinActivePluginSessionExtensionRegistry(pluginRegistry);
}
function logGatewayPluginDiagnostics(params) {
	for (const diag of params.diagnostics) {
		const details = [diag.pluginId ? `plugin=${diag.pluginId}` : null, diag.source ? `source=${diag.source}` : null].filter((entry) => Boolean(entry)).join(", ");
		const message = details ? `[plugins] ${diag.message} (${details})` : `[plugins] ${diag.message}`;
		if (diag.level === "error") params.log.error(message);
		else params.log.info(message);
	}
}
/** Prepares gateway plugin runtime and returns the loaded plugin registry state. */
function prepareGatewayPluginLoad(params) {
	const activationSourceConfig = params.activationSourceConfig ?? params.cfg;
	const autoEnabled = require_plugin_auto_enable.applyPluginAutoEnable({
		config: activationSourceConfig,
		env: process.env,
		...params.pluginLookUpTable?.manifestRegistry ? { manifestRegistry: params.pluginLookUpTable.manifestRegistry } : {},
		discovery: params.pluginLookUpTable?.discovery
	});
	const resolvedConfig = activationSourceConfig === params.cfg ? autoEnabled.config : require_plugin_activation_runtime_config.mergeActivationSectionsIntoRuntimeConfig({
		runtimeConfig: params.cfg,
		activationConfig: autoEnabled.config
	});
	const durableReasons = params.pluginLookUpTable ? require_worker_provider_registry.resolveDurableWorkerProviderAutoEnabledReasons(params.pluginLookUpTable.manifestRegistry, params.pluginLookUpTable.workerProviderIds) : {};
	const autoEnabledReasons = {
		...autoEnabled.autoEnabledReasons,
		...durableReasons
	};
	installGatewayPluginRuntimeEnvironment(resolvedConfig);
	const loaded = require_server_plugins.loadGatewayPlugins({
		cfg: resolvedConfig,
		activationSourceConfig,
		autoEnabledReasons,
		workspaceDir: params.workspaceDir,
		log: params.log,
		...params.coreGatewayHandlers !== void 0 && { coreGatewayHandlers: params.coreGatewayHandlers },
		...params.coreGatewayMethodNames !== void 0 && { coreGatewayMethodNames: params.coreGatewayMethodNames },
		...params.hostServices !== void 0 && { hostServices: params.hostServices },
		baseMethods: params.baseMethods,
		pluginIds: params.pluginIds,
		pluginLookUpTable: params.pluginLookUpTable,
		preferSetupRuntimeForChannelPlugins: params.preferSetupRuntimeForChannelPlugins,
		suppressPluginInfoLogs: params.suppressPluginInfoLogs,
		startupTrace: params.startupTrace
	});
	params.beforePrimeRegistry?.(loaded.pluginRegistry);
	require_binding_registry.primeConfiguredBindingRegistry({ cfg: resolvedConfig });
	if ((params.logDiagnostics ?? true) && loaded.pluginRegistry.diagnostics.length > 0) logGatewayPluginDiagnostics({
		diagnostics: loaded.pluginRegistry.diagnostics,
		log: params.log
	});
	return loaded;
}
/** Loads and pins gateway plugins during normal gateway startup. */
function loadGatewayStartupPlugins(params) {
	return prepareGatewayPluginLoad({
		...params,
		beforePrimeRegistry: pinGatewayPluginRuntimeRegistries
	});
}
/** Reloads deferred gateway plugins while preserving startup bootstrap behavior. */
function reloadDeferredGatewayPlugins(params) {
	return prepareGatewayPluginLoad({
		...params,
		beforePrimeRegistry: pinGatewayPluginRuntimeRegistries
	});
}
//#endregion
exports.loadGatewayStartupPlugins = loadGatewayStartupPlugins;
exports.prepareGatewayPluginLoad = prepareGatewayPluginLoad;
exports.reloadDeferredGatewayPlugins = reloadDeferredGatewayPlugins;
