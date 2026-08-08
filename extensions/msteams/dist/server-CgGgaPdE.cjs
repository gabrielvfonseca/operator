require("./rolldown-runtime-u92d-OFm.cjs");
require("./message-handler-Dd8gzPWd.cjs");
//#region src/gateway/server.ts
function emitStartupTrace(name, durationMs, totalMs) {
	if (!process.env.OPERATOR_GATEWAY_STARTUP_TRACE) return;
	process.stderr.write(`[gateway] startup trace: ${name} ${durationMs.toFixed(1)}ms total=${totalMs.toFixed(1)}ms\n`);
}
async function loadServerImpl() {
	const startupStartedAt = performance.now();
	const before = performance.now();
	try {
		return await Promise.resolve().then(() => require("./server.impl--ce_8lM6.cjs"));
	} finally {
		const now = performance.now();
		emitStartupTrace("gateway.server-impl-import", now - before, now - startupStartedAt);
	}
}
/** Starts the gateway server after lazily loading the full server implementation. */
async function startGatewayServer(...args) {
	return await (await loadServerImpl()).startGatewayServer(...args);
}
//#endregion
exports.startGatewayServer = startGatewayServer;
