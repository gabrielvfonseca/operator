const require_session_key = require("./session-key-BQFkCTNx.cjs");
const require_session_accessor = require("./session-accessor-D_W4fZCX.cjs");
const require_paths = require("./paths-DsfW3Lup.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/run-session-target.ts
/** Resolves the active runtime target used by current run/session internals. */
async function resolveAgentRunSessionTarget(params) {
	const sessionTarget = params.sessionTarget;
	const agentId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionTarget?.agentId) ?? params.agentId;
	const sessionId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionTarget?.sessionId) ?? params.sessionId;
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionTarget?.sessionKey) ?? params.sessionKey;
	const effectiveAgentId = agentId ?? require_session_key.resolveAgentIdFromSessionKey(sessionKey);
	if (sessionTarget && !sessionKey) throw new Error(`Cannot resolve run session target without a session key: ${sessionId}`);
	if (sessionTarget && sessionKey) {
		const storePath = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(sessionTarget.storePath) ?? require_paths.resolveStorePath(params.config?.session?.store, { agentId: effectiveAgentId });
		return await require_session_accessor.resolveSessionTranscriptRuntimeTarget({
			...effectiveAgentId ? { agentId: effectiveAgentId } : {},
			sessionId,
			sessionKey,
			storePath,
			...sessionTarget.threadId !== void 0 ? { threadId: sessionTarget.threadId } : {}
		});
	}
	const sessionFile = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionFile);
	if (sessionFile) return {
		agentId: effectiveAgentId ?? "",
		sessionFile,
		sessionId,
		sessionKey: sessionKey ?? ""
	};
	if (!sessionKey) throw new Error(`Cannot resolve run session target without a session key: ${sessionId}`);
	const storePath = require_paths.resolveStorePath(params.config?.session?.store, { agentId: effectiveAgentId });
	return await require_session_accessor.resolveSessionTranscriptRuntimeTarget({
		...effectiveAgentId ? { agentId: effectiveAgentId } : {},
		sessionId,
		sessionKey,
		storePath
	});
}
/** Applies identity fields from the explicit target before legacy backfills run. */
function applyAgentRunSessionTargetIdentity(params) {
	const target = params.sessionTarget;
	if (!target) return params;
	return {
		...params,
		agentId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.agentId) ?? params.agentId,
		sessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.sessionId) ?? params.sessionId,
		sessionKey: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(target.sessionKey) ?? params.sessionKey
	};
}
//#endregion
Object.defineProperty(exports, "applyAgentRunSessionTargetIdentity", {
	enumerable: true,
	get: function() {
		return applyAgentRunSessionTargetIdentity;
	}
});
Object.defineProperty(exports, "resolveAgentRunSessionTarget", {
	enumerable: true,
	get: function() {
		return resolveAgentRunSessionTarget;
	}
});
