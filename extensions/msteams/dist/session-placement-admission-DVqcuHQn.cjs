//#region src/agents/session-placement-admission.ts
const state = require("./global-singleton-BB0yU6DV.cjs").resolveGlobalSingleton(Symbol.for("operator.sessionPlacementAdmissionState"), () => ({}));
function installSessionPlacementAdmissionProvider(provider) {
	state.provider = provider;
	return () => {
		if (state.provider === provider) state.provider = void 0;
	};
}
function installSessionPlacementResetGuard(guard) {
	state.resetGuard = guard;
	return () => {
		if (state.resetGuard === guard) state.resetGuard = void 0;
	};
}
function resolveSessionPlacementResetBlock(sessionId) {
	return state.resetGuard?.(sessionId);
}
async function withSessionPlacementTurnAdmission(claim, params, task) {
	const provider = state.provider;
	if (!provider) return await task();
	return await provider.executeTurn(claim, params, task);
}
async function withLocalSessionPlacementTurnAdmission(claim, task) {
	const provider = state.provider;
	if (!provider) return await task();
	return await provider.executeLocalTurn(claim, task);
}
//#endregion
Object.defineProperty(exports, "installSessionPlacementAdmissionProvider", {
	enumerable: true,
	get: function() {
		return installSessionPlacementAdmissionProvider;
	}
});
Object.defineProperty(exports, "installSessionPlacementResetGuard", {
	enumerable: true,
	get: function() {
		return installSessionPlacementResetGuard;
	}
});
Object.defineProperty(exports, "resolveSessionPlacementResetBlock", {
	enumerable: true,
	get: function() {
		return resolveSessionPlacementResetBlock;
	}
});
Object.defineProperty(exports, "withLocalSessionPlacementTurnAdmission", {
	enumerable: true,
	get: function() {
		return withLocalSessionPlacementTurnAdmission;
	}
});
Object.defineProperty(exports, "withSessionPlacementTurnAdmission", {
	enumerable: true,
	get: function() {
		return withSessionPlacementTurnAdmission;
	}
});
