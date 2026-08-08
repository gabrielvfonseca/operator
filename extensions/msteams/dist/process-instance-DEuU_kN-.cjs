//#region src/gateway/process-instance.ts
const gatewayProcessInstanceId = (0, require("node:crypto").randomUUID)();
/** Stable for one Gateway process; changes across every restart, including PID reuse. */
function getGatewayProcessInstanceId() {
	return gatewayProcessInstanceId;
}
//#endregion
Object.defineProperty(exports, "getGatewayProcessInstanceId", {
	enumerable: true,
	get: function() {
		return getGatewayProcessInstanceId;
	}
});
