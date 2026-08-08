const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./agent-scope-Ce0XqMNr.cjs");
const require_agent_scope_config = require("./agent-scope-config-DpWhyljG.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
const require_loader = require("./loader-BXYDwRk1.cjs");
const require_runtime_snapshot = require("./runtime-snapshot-ByVfkwaz.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
//#region src/infra/outbound/channel-bootstrap.runtime.ts
var channel_bootstrap_runtime_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	bootstrapOutboundChannelPlugin: () => bootstrapOutboundChannelPlugin,
	resetOutboundChannelBootstrapStateForTests: () => resetOutboundChannelBootstrapStateForTests
});
const MAX_BOOTSTRAP_CONFIG_GENERATIONS = 64;
let bootstrapRegistryGeneration;
const bootstrapAttemptedChannelsByConfig = /* @__PURE__ */ new Map();
function resolveBootstrapRegistryGeneration() {
	return `${require_runtime.getActivePluginChannelRegistryVersion()}:${require_runtime.getActivePluginRegistryVersion()}`;
}
function resolveBootstrapAttemptedChannels(cfg) {
	const registryGeneration = resolveBootstrapRegistryGeneration();
	if (registryGeneration !== bootstrapRegistryGeneration) {
		bootstrapRegistryGeneration = registryGeneration;
		bootstrapAttemptedChannelsByConfig.clear();
	}
	const configKey = require_runtime_snapshot.resolveRuntimeConfigCacheKey(cfg);
	const existing = bootstrapAttemptedChannelsByConfig.get(configKey);
	if (existing) {
		bootstrapAttemptedChannelsByConfig.delete(configKey);
		bootstrapAttemptedChannelsByConfig.set(configKey, existing);
		return existing;
	}
	if (bootstrapAttemptedChannelsByConfig.size >= MAX_BOOTSTRAP_CONFIG_GENERATIONS) {
		const oldestConfigKey = bootstrapAttemptedChannelsByConfig.keys().next().value;
		if (oldestConfigKey !== void 0) bootstrapAttemptedChannelsByConfig.delete(oldestConfigKey);
	}
	const attemptedChannels = /* @__PURE__ */ new Set();
	bootstrapAttemptedChannelsByConfig.set(configKey, attemptedChannels);
	return attemptedChannels;
}
/** Clears the per-generation channel bootstrap retry guard for isolated tests. */
function resetOutboundChannelBootstrapStateForTests() {
	bootstrapRegistryGeneration = void 0;
	bootstrapAttemptedChannelsByConfig.clear();
}
function channelEntryCanSend(entry) {
	return Boolean(entry?.plugin?.outbound?.sendText ?? entry?.plugin?.message?.send?.text);
}
function findChannelEntry(registry, channel) {
	return registry?.channels?.find((entry) => entry?.plugin?.id === channel);
}
function canResolveSendCapableChannel(channel) {
	const activeChannelRegistry = require_runtime.getActivePluginChannelRegistry();
	if (channelEntryCanSend(findChannelEntry(activeChannelRegistry, channel))) return true;
	const activeRegistry = require_runtime.getActivePluginRegistry();
	if (activeRegistry && activeRegistry !== activeChannelRegistry) return channelEntryCanSend(findChannelEntry(activeRegistry, channel));
	return false;
}
/** Loads runtime plugins on demand when a selected outbound channel has only a setup shell. */
function bootstrapOutboundChannelPlugin(params) {
	const cfg = params.cfg;
	if (!cfg) return;
	if (canResolveSendCapableChannel(params.channel)) return;
	const attemptedChannels = resolveBootstrapAttemptedChannels(cfg);
	if (attemptedChannels.has(params.channel)) return;
	attemptedChannels.add(params.channel);
	const autoEnabled = require_plugin_auto_enable.applyPluginAutoEnable({ config: cfg });
	const defaultAgentId = require_agent_scope_config.resolveDefaultAgentId(autoEnabled.config);
	const workspaceDir = require_agent_scope_config.resolveAgentWorkspaceDir(autoEnabled.config, defaultAgentId);
	try {
		require_loader.resolveRuntimePluginRegistry({
			config: autoEnabled.config,
			activationSourceConfig: cfg,
			autoEnabledReasons: autoEnabled.autoEnabledReasons,
			workspaceDir,
			runtimeOptions: { allowGatewaySubagentBinding: true }
		});
	} catch {}
	bootstrapRegistryGeneration = resolveBootstrapRegistryGeneration();
	if (!canResolveSendCapableChannel(params.channel)) resolveBootstrapAttemptedChannels(cfg).add(params.channel);
}
//#endregion
Object.defineProperty(exports, "bootstrapOutboundChannelPlugin", {
	enumerable: true,
	get: function() {
		return bootstrapOutboundChannelPlugin;
	}
});
Object.defineProperty(exports, "channel_bootstrap_runtime_exports", {
	enumerable: true,
	get: function() {
		return channel_bootstrap_runtime_exports;
	}
});
