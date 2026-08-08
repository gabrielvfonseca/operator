const require_runtime = require("./runtime-DUfj3X7c.cjs");
//#region src/channels/plugins/registry-loader.ts
/**
* Creates a lazy loader that resolves one value from the active channel registry.
*/
function createChannelRegistryLoader(resolveValue) {
	return async (id) => {
		const resolveFromRegistry = (registry) => {
			const pluginEntry = registry?.channels.find((entry) => entry.plugin.id === id);
			return pluginEntry ? resolveValue(pluginEntry) : void 0;
		};
		const channelRegistry = require_runtime.getActivePluginChannelRegistry();
		const channelValue = resolveFromRegistry(channelRegistry);
		if (channelValue !== void 0) return channelValue;
		const activeRegistry = require_runtime.getActivePluginRegistry();
		if (activeRegistry && activeRegistry !== channelRegistry) return resolveFromRegistry(activeRegistry);
	};
}
//#endregion
//#region src/channels/plugins/outbound/load.ts
const loadOutboundAdapterFromRegistry = createChannelRegistryLoader((entry) => entry.plugin.outbound);
async function loadChannelOutboundAdapter(id) {
	return loadOutboundAdapterFromRegistry(id);
}
//#endregion
Object.defineProperty(exports, "loadChannelOutboundAdapter", {
	enumerable: true,
	get: function() {
		return loadChannelOutboundAdapter;
	}
});
