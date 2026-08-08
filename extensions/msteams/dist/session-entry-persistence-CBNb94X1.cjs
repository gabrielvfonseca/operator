const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_lifecycle = require("./lifecycle-D3m53H2V.cjs");
const require_session_snapshot_merge = require("./session-snapshot-merge-BloJoO_g.cjs");
//#region src/auto-reply/reply/session-entry-persistence.ts
var session_entry_persistence_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ persistReplySessionEntry: () => persistReplySessionEntry });
/** Persists reply-owned state without reverting concurrent session management. */
async function persistReplySessionEntry(params) {
	let lifecycleError;
	let lifecycleEntry;
	const persisted = await require_session_accessor.patchSessionEntry({
		sessionKey: params.sessionKey,
		storePath: params.storePath
	}, (_entry, context) => {
		if (!context.existingEntry) {
			if (params.allowCreate !== true) {
				lifecycleError = require_lifecycle.resolveSessionWorkStartError(params.sessionKey, void 0, { expectedSessionId: params.initialEntry.sessionId });
				return null;
			}
			return params.entry;
		}
		lifecycleError = require_lifecycle.resolveSessionWorkStartError(params.sessionKey, context.existingEntry, { expectedSessionId: params.initialEntry.sessionId });
		if (lifecycleError) {
			lifecycleEntry = context.existingEntry;
			return null;
		}
		if (require_session_snapshot_merge.sessionSnapshotTouchedFieldsConflict({
			initial: params.initialEntry,
			next: params.entry,
			current: context.existingEntry,
			touchedFields: params.touchedFields
		})) return null;
		return require_session_snapshot_merge.mergeSessionSnapshotChanges({
			initial: params.initialEntry,
			next: params.entry,
			current: context.existingEntry,
			reassertLiveModelSwitchPending: params.reassertLiveModelSwitchPending
		});
	}, {
		fallbackEntry: params.entry,
		replaceEntry: true,
		skipMaintenance: params.skipMaintenance
	});
	if (lifecycleError) return {
		status: "lifecycle-invalidated",
		error: lifecycleError,
		...lifecycleEntry ? { entry: lifecycleEntry } : {}
	};
	if (!persisted) return {
		status: "lifecycle-invalidated",
		error: `Session "${params.sessionKey}" changed while starting work. Retry.`
	};
	return {
		status: "current",
		entry: persisted
	};
}
//#endregion
Object.defineProperty(exports, "persistReplySessionEntry", {
	enumerable: true,
	get: function() {
		return persistReplySessionEntry;
	}
});
Object.defineProperty(exports, "session_entry_persistence_exports", {
	enumerable: true,
	get: function() {
		return session_entry_persistence_exports;
	}
});
