//#region src/agents/model-provider-auth-state.ts
var model_provider_auth_state_exports = /* @__PURE__ */ require("./rolldown-runtime-u92d-OFm.cjs").__exportAll({
	cancelCurrentProviderAuthWarmWorker: () => cancelCurrentProviderAuthWarmWorker,
	claimCurrentProviderAuthStateGeneration: () => claimCurrentProviderAuthStateGeneration,
	clearCurrentProviderAuthState: () => clearCurrentProviderAuthState,
	clearCurrentProviderAuthWarmWorker: () => clearCurrentProviderAuthWarmWorker,
	getCurrentProviderAuthStates: () => getCurrentProviderAuthStates,
	isCurrentProviderAuthStateGeneration: () => isCurrentProviderAuthStateGeneration,
	publishProviderAuthWarmSnapshot: () => publishProviderAuthWarmSnapshot,
	setCurrentProviderAuthWarmWorker: () => setCurrentProviderAuthWarmWorker
});
let currentProviderAuthStates = null;
let currentProviderAuthStateGeneration = 0;
let currentProviderAuthWarmWorker;
function getCurrentProviderAuthStates() {
	return currentProviderAuthStates;
}
function claimCurrentProviderAuthStateGeneration() {
	currentProviderAuthStateGeneration += 1;
	return currentProviderAuthStateGeneration;
}
function isCurrentProviderAuthStateGeneration(generation) {
	return generation === currentProviderAuthStateGeneration;
}
function setCurrentProviderAuthWarmWorker(handle) {
	currentProviderAuthWarmWorker = handle;
}
function clearCurrentProviderAuthWarmWorker(handle) {
	if (currentProviderAuthWarmWorker === handle) currentProviderAuthWarmWorker = void 0;
}
function cancelCurrentProviderAuthWarmWorker() {
	const current = currentProviderAuthWarmWorker;
	if (!current) return;
	current.cancelled = true;
	currentProviderAuthWarmWorker = void 0;
	current.worker.terminate();
}
function clearCurrentProviderAuthState() {
	currentProviderAuthStates = null;
	claimCurrentProviderAuthStateGeneration();
	cancelCurrentProviderAuthWarmWorker();
}
function publishProviderAuthWarmSnapshot(snapshot) {
	currentProviderAuthStates = new Map(snapshot.agents.map((state) => [state.agentId, {
		agentId: state.agentId,
		configFingerprint: state.configFingerprint,
		providers: new Map(state.providers)
	}]));
}
//#endregion
Object.defineProperty(exports, "cancelCurrentProviderAuthWarmWorker", {
	enumerable: true,
	get: function() {
		return cancelCurrentProviderAuthWarmWorker;
	}
});
Object.defineProperty(exports, "claimCurrentProviderAuthStateGeneration", {
	enumerable: true,
	get: function() {
		return claimCurrentProviderAuthStateGeneration;
	}
});
Object.defineProperty(exports, "clearCurrentProviderAuthState", {
	enumerable: true,
	get: function() {
		return clearCurrentProviderAuthState;
	}
});
Object.defineProperty(exports, "clearCurrentProviderAuthWarmWorker", {
	enumerable: true,
	get: function() {
		return clearCurrentProviderAuthWarmWorker;
	}
});
Object.defineProperty(exports, "getCurrentProviderAuthStates", {
	enumerable: true,
	get: function() {
		return getCurrentProviderAuthStates;
	}
});
Object.defineProperty(exports, "isCurrentProviderAuthStateGeneration", {
	enumerable: true,
	get: function() {
		return isCurrentProviderAuthStateGeneration;
	}
});
Object.defineProperty(exports, "model_provider_auth_state_exports", {
	enumerable: true,
	get: function() {
		return model_provider_auth_state_exports;
	}
});
Object.defineProperty(exports, "publishProviderAuthWarmSnapshot", {
	enumerable: true,
	get: function() {
		return publishProviderAuthWarmSnapshot;
	}
});
Object.defineProperty(exports, "setCurrentProviderAuthWarmWorker", {
	enumerable: true,
	get: function() {
		return setCurrentProviderAuthWarmWorker;
	}
});
