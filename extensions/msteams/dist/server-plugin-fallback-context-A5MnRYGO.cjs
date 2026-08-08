const require_global_singleton = require("./global-singleton-BB0yU6DV.cjs");
//#region src/gateway/server-plugin-fallback-context.ts
const FALLBACK_GATEWAY_CONTEXT_STATE_KEY = Symbol.for("operator.fallbackGatewayContextState");
const getFallbackGatewayContextState = () => require_global_singleton.resolveGlobalSingleton(FALLBACK_GATEWAY_CONTEXT_STATE_KEY, () => ({
	context: void 0,
	resolveContext: void 0
}));
function setFallbackGatewayContextResolver(resolveContext) {
	const fallbackGatewayContextState = getFallbackGatewayContextState();
	fallbackGatewayContextState.context = void 0;
	fallbackGatewayContextState.resolveContext = resolveContext;
	return () => {
		const currentFallbackGatewayContextState = getFallbackGatewayContextState();
		if (currentFallbackGatewayContextState.resolveContext === resolveContext) {
			currentFallbackGatewayContextState.context = void 0;
			currentFallbackGatewayContextState.resolveContext = void 0;
		}
	};
}
function getFallbackGatewayContext() {
	const fallbackGatewayContextState = getFallbackGatewayContextState();
	return fallbackGatewayContextState.resolveContext?.() ?? fallbackGatewayContextState.context;
}
//#endregion
Object.defineProperty(exports, "getFallbackGatewayContext", {
	enumerable: true,
	get: function() {
		return getFallbackGatewayContext;
	}
});
Object.defineProperty(exports, "setFallbackGatewayContextResolver", {
	enumerable: true,
	get: function() {
		return setFallbackGatewayContextResolver;
	}
});
