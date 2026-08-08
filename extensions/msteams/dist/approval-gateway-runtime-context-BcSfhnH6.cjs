const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
let node_async_hooks = require("node:async_hooks");
//#region src/infra/approval-gateway-runtime-context.ts
const approvalGatewayRuntimeScope = require_global_singleton.resolveGlobalSingleton(Symbol.for("operator.approvalGatewayRuntimeScope"), () => new node_async_hooks.AsyncLocalStorage());
/** Runs one channel account task with its owning Gateway approval principal. */
function withGatewayNativeApprovalRuntime(runtime, run) {
	return runtime ? approvalGatewayRuntimeScope.run(runtime, run) : run();
}
/** Returns the Gateway approval principal for the current channel account task. */
function getGatewayNativeApprovalRuntime() {
	return approvalGatewayRuntimeScope.getStore();
}
//#endregion
Object.defineProperty(exports, "getGatewayNativeApprovalRuntime", {
	enumerable: true,
	get: function() {
		return getGatewayNativeApprovalRuntime;
	}
});
Object.defineProperty(exports, "withGatewayNativeApprovalRuntime", {
	enumerable: true,
	get: function() {
		return withGatewayNativeApprovalRuntime;
	}
});
