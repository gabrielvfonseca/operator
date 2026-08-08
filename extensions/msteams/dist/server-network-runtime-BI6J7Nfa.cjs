require("./rolldown-runtime-u92d-OFm.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
//#region src/gateway/server-network-runtime.ts
/** Applies process-wide gateway network runtime setup. */
function bootstrapGatewayNetworkRuntime() {
	require_undici_global_dispatcher.ensureGlobalUndiciEnvProxyDispatcher();
}
//#endregion
exports.bootstrapGatewayNetworkRuntime = bootstrapGatewayNetworkRuntime;
