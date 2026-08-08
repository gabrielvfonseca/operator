const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_ids = require("./ids-BOvGIu4A.cjs");
require("./registry-BWWaGAnQ.cjs");
const require_bundled = require("./bundled-sSrX2DvO.cjs");
const require_runtime = require("./runtime-DUfj3X7c.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/channels/plugins/setup-registry.ts
/**
* Channel setup plugin registry.
*
* Resolves loaded or bundled setup plugins for onboarding flows.
*/
var setup_registry_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	getChannelSetupPlugin: () => getChannelSetupPlugin,
	listActiveChannelSetupPlugins: () => listActiveChannelSetupPlugins,
	listChannelSetupPlugins: () => listChannelSetupPlugins
});
function dedupeSetupPlugins(plugins) {
	const seen = /* @__PURE__ */ new Set();
	const resolved = [];
	for (const plugin of plugins) {
		const id = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(plugin.id) ?? "";
		if (!id || seen.has(id)) continue;
		seen.add(id);
		resolved.push(plugin);
	}
	return resolved;
}
function sortChannelSetupPlugins(plugins) {
	return dedupeSetupPlugins(plugins).toSorted((a, b) => {
		const indexA = require_ids.CHAT_CHANNEL_ORDER.indexOf(a.id);
		const indexB = require_ids.CHAT_CHANNEL_ORDER.indexOf(b.id);
		const orderA = a.meta.order ?? (indexA === -1 ? 999 : indexA);
		const orderB = b.meta.order ?? (indexB === -1 ? 999 : indexB);
		if (orderA !== orderB) return orderA - orderB;
		return a.id.localeCompare(b.id);
	});
}
function resolveChannelSetupPlugins() {
	const registryPlugins = (require_runtime.requireActivePluginRegistry().channelSetups ?? []).map((entry) => entry.plugin);
	const sorted = sortChannelSetupPlugins(registryPlugins.length > 0 ? registryPlugins : require_bundled.listBundledChannelSetupPlugins());
	const byId = /* @__PURE__ */ new Map();
	for (const plugin of sorted) byId.set(plugin.id, plugin);
	return {
		sorted,
		byId
	};
}
/**
* Lists setup-capable channel plugins, falling back to bundled setup metadata.
*/
function listChannelSetupPlugins() {
	return resolveChannelSetupPlugins().sorted.slice();
}
/**
* Lists setup plugins from the active channel registry only.
*/
function listActiveChannelSetupPlugins() {
	return sortChannelSetupPlugins((require_runtime.getActivePluginChannelRegistry()?.channelSetups ?? []).map((entry) => entry.plugin));
}
/**
* Returns one setup-capable channel plugin by id.
*/
function getChannelSetupPlugin(id) {
	const resolvedId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(id) ?? "";
	if (!resolvedId) return;
	return resolveChannelSetupPlugins().byId.get(resolvedId);
}
//#endregion
Object.defineProperty(exports, "getChannelSetupPlugin", {
	enumerable: true,
	get: function() {
		return getChannelSetupPlugin;
	}
});
Object.defineProperty(exports, "listActiveChannelSetupPlugins", {
	enumerable: true,
	get: function() {
		return listActiveChannelSetupPlugins;
	}
});
Object.defineProperty(exports, "listChannelSetupPlugins", {
	enumerable: true,
	get: function() {
		return listChannelSetupPlugins;
	}
});
Object.defineProperty(exports, "setup_registry_exports", {
	enumerable: true,
	get: function() {
		return setup_registry_exports;
	}
});
