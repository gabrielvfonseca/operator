//#region src/gateway/server-recovery-runtime-context.ts
let activeRuntime;
/** Registers the recovery principal owned by the latest process-global Gateway instance. */
function registerGatewayRecoveryRuntime(runtime) {
	const owner = Symbol("gateway-recovery-runtime");
	activeRuntime = {
		owner,
		runtime
	};
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (activeRuntime?.owner === owner) activeRuntime = void 0;
	};
}
function getGatewayRecoveryRuntime() {
	return activeRuntime?.runtime;
}
//#endregion
Object.defineProperty(exports, "getGatewayRecoveryRuntime", {
	enumerable: true,
	get: function() {
		return getGatewayRecoveryRuntime;
	}
});
Object.defineProperty(exports, "registerGatewayRecoveryRuntime", {
	enumerable: true,
	get: function() {
		return registerGatewayRecoveryRuntime;
	}
});
