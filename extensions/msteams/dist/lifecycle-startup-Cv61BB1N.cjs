require("./rolldown-runtime-u92d-OFm.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
//#region src/channels/plugins/lifecycle-startup.ts
/**
* Runs startup maintenance hooks for all loaded channel plugins.
*/
async function runChannelPluginStartupMaintenance(params) {
	for (const plugin of require_registry.listChannelPlugins()) {
		const runStartupMaintenance = plugin.lifecycle?.runStartupMaintenance;
		if (!runStartupMaintenance) continue;
		try {
			await runStartupMaintenance(params);
		} catch (err) {
			params.log.warn?.(`${params.logPrefix?.trim() || "gateway"}: ${plugin.id} startup maintenance failed; continuing: ${String(err)}`);
		}
	}
}
//#endregion
exports.runChannelPluginStartupMaintenance = runChannelPluginStartupMaintenance;
