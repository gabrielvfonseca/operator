//#region src/infra/heartbeat-run-scope.ts
const HEARTBEAT_RUN_SCOPE = Symbol("operator.heartbeatRunScope");
function resolveHeartbeatRunScope(options) {
	return options?.[HEARTBEAT_RUN_SCOPE];
}
//#endregion
Object.defineProperty(exports, "HEARTBEAT_RUN_SCOPE", {
	enumerable: true,
	get: function() {
		return HEARTBEAT_RUN_SCOPE;
	}
});
Object.defineProperty(exports, "resolveHeartbeatRunScope", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatRunScope;
	}
});
