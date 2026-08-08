require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_abort_cutoff = require("./abort-cutoff-BOwNx53m.cjs");
//#region src/auto-reply/reply/abort-cutoff.runtime.ts
/** Runtime persistence helper for clearing abort-cutoff state from sessions. */
/** Clears abort cutoff state in memory and persisted session storage. */
async function clearAbortCutoffInSessionRuntime(params) {
	const { sessionEntry, sessionStore, sessionKey, storePath } = params;
	if (!sessionEntry || !sessionStore || !sessionKey || !require_abort_cutoff.hasAbortCutoff(sessionEntry)) return false;
	require_abort_cutoff.applyAbortCutoffToSessionEntry(sessionEntry, void 0);
	const updatedAt = Date.now();
	sessionEntry.updatedAt = updatedAt;
	sessionStore[sessionKey] = sessionEntry;
	if (storePath) await require_session_accessor.patchSessionEntry({
		storePath,
		sessionKey
	}, () => ({
		abortCutoffMessageSid: void 0,
		abortCutoffTimestamp: void 0,
		updatedAt
	}), { fallbackEntry: sessionEntry });
	return true;
}
//#endregion
exports.clearAbortCutoffInSessionRuntime = clearAbortCutoffInSessionRuntime;
