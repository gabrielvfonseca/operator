const require_internal_hooks = require("./internal-hooks-CP-OV43M.cjs");
//#region src/gateway/session-patch-hooks.ts
/** Triggers internal session patch hooks when listeners are registered. */
function triggerSessionPatchHook(params) {
	if (!require_internal_hooks.hasInternalHookListeners("session", "patch")) return;
	const hookContext = structuredClone({
		sessionEntry: params.sessionEntry,
		patch: params.patch,
		cfg: params.cfg
	});
	require_internal_hooks.triggerInternalHook({
		type: "session",
		action: "patch",
		sessionKey: params.sessionKey,
		context: hookContext,
		timestamp: /* @__PURE__ */ new Date(),
		messages: []
	});
}
//#endregion
Object.defineProperty(exports, "triggerSessionPatchHook", {
	enumerable: true,
	get: function() {
		return triggerSessionPatchHook;
	}
});
