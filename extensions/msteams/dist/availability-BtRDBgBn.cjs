const require_policy = require("./policy-xAgUJHj7.cjs");
const require_registry = require("./registry-DPQgylfd.cjs");
//#region src/acp/runtime/availability.ts
/** Returns whether ACP runtime spawning is allowed and the selected backend is healthy enough. */
function isAcpRuntimeSpawnAvailable(params) {
	if (params.sandboxed === true) return false;
	if (params.config && !require_policy.isAcpEnabledByPolicy(params.config)) return false;
	const backend = require_registry.getAcpRuntimeBackend(params.backendId ?? params.config?.acp?.backend);
	if (!backend) return false;
	if (!backend.healthy) return true;
	try {
		return backend.healthy();
	} catch {
		return false;
	}
}
//#endregion
Object.defineProperty(exports, "isAcpRuntimeSpawnAvailable", {
	enumerable: true,
	get: function() {
		return isAcpRuntimeSpawnAvailable;
	}
});
