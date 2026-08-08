const require_call = require("./call-CphTnsHC.cjs");
const require_sessions_helpers = require("./sessions-helpers-BzXDIb2t.cjs");
const require_acp_reset_target = require("./acp-reset-target-D6Yggd8E.cjs");
const require_context = require("./context-V4D9UcfJ.cjs");
const require_shared = require("./shared-DZ6zsntB.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-acp/targets.ts
async function resolveSessionKeyByToken(token) {
	const trimmed = token.trim();
	if (!trimmed) return null;
	const attempts = [{ key: trimmed }];
	if (require_sessions_helpers.SESSION_ID_RE.test(trimmed)) attempts.push({ sessionId: trimmed });
	attempts.push({ label: trimmed });
	for (const params of attempts) try {
		const key = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)((await require_call.callGateway({
			method: "sessions.resolve",
			params,
			timeoutMs: 8e3
		}))?.key) ?? "";
		if (key) return key;
	} catch {}
	return null;
}
function resolveBoundAcpThreadSessionKey(params) {
	const activeSessionKey = ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.ctx.CommandTargetSessionKey) ?? "") || ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.sessionKey) ?? "");
	const bindingContext = require_context.resolveAcpCommandBindingContext(params);
	return require_acp_reset_target.resolveEffectiveResetTargetSessionKey({
		cfg: params.cfg,
		channel: bindingContext.channel,
		accountId: bindingContext.accountId,
		conversationId: bindingContext.conversationId,
		parentConversationId: bindingContext.parentConversationId,
		activeSessionKey,
		allowNonAcpBindingSessionKey: true,
		skipConfiguredFallbackWhenActiveSessionNonAcp: false
	});
}
async function resolveAcpTargetSessionKey(params) {
	const token = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.token) ?? "";
	if (token) {
		const resolved = await resolveSessionKeyByToken(token);
		if (resolved) return {
			ok: true,
			sessionKey: resolved
		};
	}
	const threadBound = resolveBoundAcpThreadSessionKey(params.commandParams);
	if (threadBound) return {
		ok: true,
		sessionKey: threadBound
	};
	if (token) return {
		ok: false,
		error: `Unable to resolve session target: ${token}`
	};
	const fallback = require_shared.resolveRequesterSessionKey(params.commandParams, { preferCommandTarget: true });
	if (!fallback) return {
		ok: false,
		error: "Missing session key."
	};
	return {
		ok: true,
		sessionKey: fallback
	};
}
//#endregion
Object.defineProperty(exports, "resolveAcpTargetSessionKey", {
	enumerable: true,
	get: function() {
		return resolveAcpTargetSessionKey;
	}
});
Object.defineProperty(exports, "resolveBoundAcpThreadSessionKey", {
	enumerable: true,
	get: function() {
		return resolveBoundAcpThreadSessionKey;
	}
});
