require("./rolldown-runtime-u92d-OFm.cjs");
require("./utils-CXqBhRFw.cjs");
const require_plugin_auto_enable = require("./plugin-auto-enable-nYwhgNCn.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
//#region src/gateway/plugin-activation-runtime-config.ts
function hasOwnValue(record, key) {
	return Object.hasOwn(record, key);
}
function mergeChannelActivationSections(params) {
	const activationChannels = params.activationConfig.channels;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(activationChannels)) return params.runtimeConfig;
	const runtimeChannels = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.runtimeConfig.channels) ? params.runtimeConfig.channels : {};
	let nextChannels;
	for (const [channelId, activationChannel] of Object.entries(activationChannels)) {
		if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(activationChannel) || !hasOwnValue(activationChannel, "enabled")) continue;
		const runtimeChannel = runtimeChannels[channelId];
		const runtimeChannelRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(runtimeChannel) ? runtimeChannel : {};
		nextChannels ??= { ...runtimeChannels };
		nextChannels[channelId] = {
			...runtimeChannelRecord,
			enabled: activationChannel.enabled
		};
	}
	if (nextChannels === void 0) return params.runtimeConfig;
	return {
		...params.runtimeConfig,
		channels: nextChannels
	};
}
function mergePluginActivationSections(params) {
	const activationPlugins = params.activationConfig.plugins;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(activationPlugins)) return params.runtimeConfig;
	const runtimePlugins = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(params.runtimeConfig.plugins) ? params.runtimeConfig.plugins : {};
	let nextPlugins;
	if (Array.isArray(activationPlugins.allow)) nextPlugins = {
		...runtimePlugins,
		allow: [...activationPlugins.allow]
	};
	const activationEntries = activationPlugins.entries;
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(activationEntries)) {
		const runtimeEntries = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(runtimePlugins.entries) ? runtimePlugins.entries : {};
		let nextEntries;
		for (const [pluginId, activationEntry] of Object.entries(activationEntries)) {
			if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(activationEntry) || !hasOwnValue(activationEntry, "enabled")) continue;
			const runtimeEntry = runtimeEntries[pluginId];
			const runtimeEntryRecord = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(runtimeEntry) ? runtimeEntry : {};
			nextEntries ??= { ...runtimeEntries };
			nextEntries[pluginId] = {
				...runtimeEntryRecord,
				enabled: activationEntry.enabled
			};
		}
		if (nextEntries !== void 0) nextPlugins = {
			...runtimePlugins,
			...nextPlugins,
			entries: nextEntries
		};
	}
	if (nextPlugins === void 0) return params.runtimeConfig;
	return {
		...params.runtimeConfig,
		plugins: nextPlugins
	};
}
/** Merges plugin/channel activation enablement into the runtime config shape. */
function mergeActivationSectionsIntoRuntimeConfig(params) {
	return mergePluginActivationSections({
		...params,
		runtimeConfig: mergeChannelActivationSections(params)
	});
}
function resolveGatewayStartupPluginActivationConfig(params) {
	return mergeActivationSectionsIntoRuntimeConfig({
		runtimeConfig: params.runtimeConfig,
		activationConfig: require_plugin_auto_enable.applyPluginAutoEnable({
			config: params.activationSourceConfig,
			env: params.env,
			...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {},
			discovery: params.discovery
		}).config
	});
}
/** Re-derives source-owned plugin activation and carries it into one reload candidate. */
function resolveGatewayReloadPluginActivationCandidate(params) {
	const activationConfig = require_plugin_auto_enable.applyPluginAutoEnable({
		config: params.sourceConfig,
		env: params.env,
		...params.manifestRegistry ? { manifestRegistry: params.manifestRegistry } : {},
		discovery: params.discovery
	}).config;
	return {
		runtimeConfig: mergeActivationSectionsIntoRuntimeConfig({
			runtimeConfig: params.runtimeConfig,
			activationConfig
		}),
		compareConfig: activationConfig
	};
}
//#endregion
exports.mergeActivationSectionsIntoRuntimeConfig = mergeActivationSectionsIntoRuntimeConfig;
exports.resolveGatewayReloadPluginActivationCandidate = resolveGatewayReloadPluginActivationCandidate;
exports.resolveGatewayStartupPluginActivationConfig = resolveGatewayStartupPluginActivationConfig;
