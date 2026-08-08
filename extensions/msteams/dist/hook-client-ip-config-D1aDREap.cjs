const require_io = require("./io-DU1xmwPS.cjs");
const require_command_queue = require("./command-queue-Bnm4_JKn.cjs");
const require_session_suspension = require("./session-suspension-BguFcopH.cjs");
//#region src/gateway/server-lanes.ts
function resolveGatewayLaneConcurrency(cfg) {
	return {
		cron: require_io.resolveCronMaxConcurrentRuns(cfg.cron),
		main: require_io.resolveAgentMaxConcurrent(cfg),
		subagent: require_io.resolveSubagentMaxConcurrent(cfg)
	};
}
function applyGatewayLaneConcurrency(concurrency, opts = {}) {
	const suspendedLaneIds = opts.gatewayStart ? require_session_suspension.enableSessionSuspensionTimersForGatewayStart((laneId, savedResumeConcurrency) => {
		switch (laneId) {
			case "cron":
			case "cron-nested": return concurrency.cron;
			case "main": return concurrency.main;
			case "nested": return 1;
			case "subagent": return concurrency.subagent;
			default: return savedResumeConcurrency;
		}
	}) : require_session_suspension.getCleanupSuspendedLaneIdsForGatewayPublication();
	if (!suspendedLaneIds.has("cron")) require_command_queue.setCommandLaneConcurrency("cron", concurrency.cron);
	if (!suspendedLaneIds.has("cron-nested")) require_command_queue.setCommandLaneConcurrency("cron-nested", concurrency.cron);
	if (!suspendedLaneIds.has("main")) require_command_queue.setCommandLaneConcurrency("main", concurrency.main);
	if (opts.gatewayStart) {
		if (!suspendedLaneIds.has("nested")) require_command_queue.setCommandLaneConcurrency("nested", 1);
	}
	if (!suspendedLaneIds.has("subagent")) require_command_queue.setCommandLaneConcurrency("subagent", concurrency.subagent);
}
//#endregion
//#region src/gateway/server/hook-client-ip-config.ts
/**
* Adapts gateway network trust config to the hooks HTTP request handler.
*/
function resolveHookClientIpConfig(cfg) {
	return {
		trustedProxies: cfg.gateway?.trustedProxies,
		allowRealIpFallback: cfg.gateway?.allowRealIpFallback === true
	};
}
//#endregion
Object.defineProperty(exports, "applyGatewayLaneConcurrency", {
	enumerable: true,
	get: function() {
		return applyGatewayLaneConcurrency;
	}
});
Object.defineProperty(exports, "resolveGatewayLaneConcurrency", {
	enumerable: true,
	get: function() {
		return resolveGatewayLaneConcurrency;
	}
});
Object.defineProperty(exports, "resolveHookClientIpConfig", {
	enumerable: true,
	get: function() {
		return resolveHookClientIpConfig;
	}
});
