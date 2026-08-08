//#region src/agents/auth-profiles/failure-hook.ts
var failure_hook_exports = /* @__PURE__ */ require("./rolldown-runtime-u92d-OFm.cjs").__exportAll({
	notifyAuthProfileFailureHook: () => notifyAuthProfileFailureHook,
	setAuthProfileFailureHook: () => setAuthProfileFailureHook
});
let authProfileFailureHook;
/** Installs or clears the process-local auth profile failure hook. */
function setAuthProfileFailureHook(hook) {
	authProfileFailureHook = hook;
}
/** Notifies the process-local auth profile failure hook. */
function notifyAuthProfileFailureHook() {
	authProfileFailureHook?.();
}
//#endregion
Object.defineProperty(exports, "failure_hook_exports", {
	enumerable: true,
	get: function() {
		return failure_hook_exports;
	}
});
Object.defineProperty(exports, "notifyAuthProfileFailureHook", {
	enumerable: true,
	get: function() {
		return notifyAuthProfileFailureHook;
	}
});
Object.defineProperty(exports, "setAuthProfileFailureHook", {
	enumerable: true,
	get: function() {
		return setAuthProfileFailureHook;
	}
});
