const require_agent_scope = require("./agent-scope-Ce0XqMNr.cjs");
const require_system_events = require("./system-events-DTXDfyAN.cjs");
const require_reply_run_registry = require("./reply-run-registry-BN03YRe9.cjs");
const require_cleanup = require("./cleanup-Do0eFW35.cjs");
const require_provider_utils = require("./provider-utils-ivH7d8vm.cjs");
//#region src/config/sessions/reset-preserved-selection.ts
/**
* Decide which model/provider/auth overrides survive a `/new` or `/reset`.
*
* Only user-driven overrides (explicit `/model`, `sessions.patch`, etc.) are
* preserved. Auto-created overrides (runtime fallbacks, rate-limit rotations)
* are cleared so resets actually return the session to the configured default.
*
* Legacy entries persisted before `modelOverrideSource` was tracked are
* treated as user-driven, matching the prior reset behavior so explicit
* selections made before the source field existed are not silently dropped.
*/
function resolveResetPreservedSelection(params) {
	const { entry } = params;
	if (!entry) return {};
	const preserved = {};
	const recoveredAutoFallbackOverride = entry.modelOverrideSource === void 0 && require_agent_scope.hasSessionAutoModelFallbackProvenance(entry);
	if ((entry.modelOverrideSource === "user" || entry.modelOverrideSource === void 0 && Boolean(entry.modelOverride) && !recoveredAutoFallbackOverride) && entry.modelOverride) {
		preserved.providerOverride = entry.providerOverride;
		preserved.modelOverride = entry.modelOverride;
		preserved.modelOverrideSource = "user";
	}
	if (entry.authProfileOverrideSource === "user" && entry.authProfileOverride) {
		preserved.authProfileOverride = entry.authProfileOverride;
		preserved.authProfileOverrideSource = entry.authProfileOverrideSource;
		if (entry.authProfileOverrideCompactionCount !== void 0) preserved.authProfileOverrideCompactionCount = entry.authProfileOverrideCompactionCount;
	}
	return preserved;
}
//#endregion
//#region src/auto-reply/reply/session-reset-cleanup.ts
/** Clears reset-related queues and system events for session keys. */
/** Clears queued follow-ups and pending system events for reset session keys. */
function clearSessionResetRuntimeState(keys, opts) {
	require_provider_utils.clearEmbeddedSessionPromptStates(keys);
	const cleared = require_cleanup.clearSessionQueues(keys);
	let systemEventsCleared = 0;
	for (const key of cleared.keys) systemEventsCleared += require_system_events.drainSystemEventEntries(key).length;
	if (opts?.activeReplySessionId) require_reply_run_registry.clearReplyRunForResetBySessionId(opts.activeReplySessionId);
	return {
		...cleared,
		systemEventsCleared
	};
}
//#endregion
Object.defineProperty(exports, "clearSessionResetRuntimeState", {
	enumerable: true,
	get: function() {
		return clearSessionResetRuntimeState;
	}
});
Object.defineProperty(exports, "resolveResetPreservedSelection", {
	enumerable: true,
	get: function() {
		return resolveResetPreservedSelection;
	}
});
