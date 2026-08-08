require("./rolldown-runtime-u92d-OFm.cjs");
const require_tailscale = require("./tailscale-ViriHRUQ.cjs");
const require_memory_runtime = require("./memory-runtime-Qfejy7hD.cjs");
//#region src/commands/status.scan.deps.runtime.ts
/** Returns a narrow memory manager adapter for status probing. */
async function getMemorySearchManager(params) {
	const { manager } = await require_memory_runtime.getActiveMemorySearchManager(params);
	if (!manager) return { manager: null };
	return { manager: {
		probeVectorStoreAvailability: manager.probeVectorStoreAvailability ? async () => await manager.probeVectorStoreAvailability() : void 0,
		async probeVectorAvailability() {
			return await manager.probeVectorAvailability();
		},
		status() {
			return manager.status();
		},
		close: manager.close ? async () => await manager.close?.() : void 0
	} };
}
//#endregion
exports.getMemorySearchManager = getMemorySearchManager;
exports.getTailnetHostname = require_tailscale.getTailnetHostname;
