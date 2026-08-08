let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/abort-cutoff.ts
function resolveAbortCutoffFromContext(ctx) {
	const messageSid = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MessageSidFull) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ctx.MessageSid);
	const timestamp = typeof ctx.Timestamp === "number" && Number.isFinite(ctx.Timestamp) ? ctx.Timestamp : void 0;
	if (!messageSid && timestamp === void 0) return;
	return {
		messageSid,
		timestamp
	};
}
function readAbortCutoffFromSessionEntry(entry) {
	if (!entry) return;
	const messageSid = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(entry.abortCutoffMessageSid);
	const timestamp = typeof entry.abortCutoffTimestamp === "number" && Number.isFinite(entry.abortCutoffTimestamp) ? entry.abortCutoffTimestamp : void 0;
	if (!messageSid && timestamp === void 0) return;
	return {
		messageSid,
		timestamp
	};
}
function hasAbortCutoff(entry) {
	return readAbortCutoffFromSessionEntry(entry) !== void 0;
}
function applyAbortCutoffToSessionEntry(entry, cutoff) {
	entry.abortCutoffMessageSid = cutoff?.messageSid;
	entry.abortCutoffTimestamp = cutoff?.timestamp;
}
function toNumericMessageSid(value) {
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value);
	if (!trimmed || !/^\d+$/.test(trimmed)) return;
	try {
		return BigInt(trimmed);
	} catch {
		return;
	}
}
function shouldSkipMessageByAbortCutoff(params) {
	const cutoffSid = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.cutoffMessageSid);
	const currentSid = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageSid);
	if (cutoffSid && currentSid) {
		const cutoffNumeric = toNumericMessageSid(cutoffSid);
		const currentNumeric = toNumericMessageSid(currentSid);
		if (cutoffNumeric !== void 0 && currentNumeric !== void 0) return currentNumeric <= cutoffNumeric;
		if (currentSid === cutoffSid) return true;
	}
	if (typeof params.cutoffTimestamp === "number" && Number.isFinite(params.cutoffTimestamp) && typeof params.timestamp === "number" && Number.isFinite(params.timestamp)) return params.timestamp <= params.cutoffTimestamp;
	return false;
}
function shouldPersistAbortCutoff(params) {
	const commandSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.commandSessionKey);
	const targetSessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.targetSessionKey);
	if (!commandSessionKey || !targetSessionKey) return true;
	return commandSessionKey === targetSessionKey;
}
//#endregion
Object.defineProperty(exports, "applyAbortCutoffToSessionEntry", {
	enumerable: true,
	get: function() {
		return applyAbortCutoffToSessionEntry;
	}
});
Object.defineProperty(exports, "hasAbortCutoff", {
	enumerable: true,
	get: function() {
		return hasAbortCutoff;
	}
});
Object.defineProperty(exports, "readAbortCutoffFromSessionEntry", {
	enumerable: true,
	get: function() {
		return readAbortCutoffFromSessionEntry;
	}
});
Object.defineProperty(exports, "resolveAbortCutoffFromContext", {
	enumerable: true,
	get: function() {
		return resolveAbortCutoffFromContext;
	}
});
Object.defineProperty(exports, "shouldPersistAbortCutoff", {
	enumerable: true,
	get: function() {
		return shouldPersistAbortCutoff;
	}
});
Object.defineProperty(exports, "shouldSkipMessageByAbortCutoff", {
	enumerable: true,
	get: function() {
		return shouldSkipMessageByAbortCutoff;
	}
});
