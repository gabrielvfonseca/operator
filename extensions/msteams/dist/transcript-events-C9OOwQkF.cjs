const require_session_key = require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/sessions/transcript-events.ts
const SESSION_TRANSCRIPT_LISTENERS = /* @__PURE__ */ new Set();
const INTERNAL_SESSION_TRANSCRIPT_LISTENERS = /* @__PURE__ */ new Set();
/** Registers an internal listener for identity-only or file-backed transcript updates. */
function onInternalSessionTranscriptUpdate(listener) {
	INTERNAL_SESSION_TRANSCRIPT_LISTENERS.add(listener);
	return () => {
		INTERNAL_SESSION_TRANSCRIPT_LISTENERS.delete(listener);
	};
}
/** Emits a normalized transcript update to all registered listeners. */
function emitSessionTranscriptUpdate(update) {
	const nextUpdate = normalizeSessionTranscriptUpdate(update, { allowIdentityOnly: true });
	if (!nextUpdate) return;
	const publicUpdate = projectPublicSessionTranscriptUpdate(nextUpdate);
	if (publicUpdate) emitPublicSessionTranscriptUpdate(publicUpdate);
	emitInternalTranscriptUpdate(nextUpdate);
}
function normalizeSessionTranscriptUpdate(update, options) {
	const normalized = {
		sessionFile: update.sessionFile,
		target: update.target,
		sessionKey: update.sessionKey,
		agentId: update.agentId,
		sessionId: update.sessionId,
		message: update.message,
		messageId: update.messageId,
		messageSeq: update.messageSeq
	};
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.sessionFile);
	const target = normalizeUpdateTarget(normalized);
	if (!trimmed && (!options.allowIdentityOnly || !target)) return;
	const messageSeq = (0, _gabrielvfonseca_normalization_core_number_coercion.asPositiveSafeInteger)(normalized.messageSeq);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.sessionKey) ?? target?.sessionKey;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.agentId) ?? target?.agentId;
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.sessionId) ?? target?.sessionId;
	return {
		...trimmed ? { sessionFile: trimmed } : {},
		...target ? { target } : {},
		...sessionKey ? { sessionKey } : {},
		...agentId ? { agentId } : {},
		...sessionId ? { sessionId } : {},
		...normalized.message !== void 0 ? { message: normalized.message } : {},
		...(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.messageId) ? { messageId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(normalized.messageId) } : {},
		...messageSeq !== void 0 ? { messageSeq } : {}
	};
}
function emitPublicSessionTranscriptUpdate(nextUpdate) {
	for (const listener of SESSION_TRANSCRIPT_LISTENERS) try {
		listener(nextUpdate);
	} catch {}
}
function emitInternalTranscriptUpdate(nextUpdate) {
	for (const listener of INTERNAL_SESSION_TRANSCRIPT_LISTENERS) try {
		listener(nextUpdate);
	} catch {}
}
function projectPublicSessionTranscriptUpdate(update) {
	const target = update.target;
	if (!target) return;
	return {
		target,
		...update.sessionKey ? { sessionKey: update.sessionKey } : {},
		...update.agentId ? { agentId: update.agentId } : {},
		...update.sessionId ? { sessionId: update.sessionId } : {},
		...update.message !== void 0 ? { message: update.message } : {},
		...update.messageId ? { messageId: update.messageId } : {},
		...update.messageSeq !== void 0 ? { messageSeq: update.messageSeq } : {}
	};
}
function normalizeUpdateTarget(update) {
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.target?.sessionKey) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.sessionKey);
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.target?.agentId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.agentId) ?? (sessionKey ? require_session_key.parseAgentSessionKey(sessionKey)?.agentId : void 0);
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.target?.sessionId) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(update.sessionId);
	if (!agentId || !sessionId || !sessionKey) return;
	return {
		agentId,
		sessionId,
		sessionKey
	};
}
//#endregion
Object.defineProperty(exports, "emitSessionTranscriptUpdate", {
	enumerable: true,
	get: function() {
		return emitSessionTranscriptUpdate;
	}
});
Object.defineProperty(exports, "onInternalSessionTranscriptUpdate", {
	enumerable: true,
	get: function() {
		return onInternalSessionTranscriptUpdate;
	}
});
