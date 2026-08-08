require("./session-key-BQFkCTNx.cjs");
const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_exec_approvals = require("./exec-approvals-CwmCCSdE.cjs");
const require_secret_equal = require("./secret-equal-_vlQ14qZ.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
let _gabrielvfonseca_normalization_core_agent_id = require("@gabrielvfonseca/normalization-core/agent-id");
//#region src/gateway/agent-runtime-identity-token.ts
const AGENT_RUNTIME_IDENTITY_TOKEN_CONTEXT = "operator:gateway-agent-runtime-identity-token:v1";
const AGENT_RUNTIME_IDENTITY_TOKEN_KIND = "agent-runtime";
const MESSAGE_ACTION_TOKEN_TTL_MS = 6e4;
async function readSharedAgentRuntimeIdentitySecret() {
	return (await require_exec_approvals.loadExecApprovalsAsync()).socket?.token?.trim() || null;
}
async function requireSharedAgentRuntimeIdentitySecret() {
	const token = (await require_exec_approvals.ensureExecApprovalsSnapshot()).file.socket?.token?.trim();
	if (!token) throw new Error("Unable to mint agent runtime identity token without local socket credentials.");
	return token;
}
function signPayload(secret, payload) {
	return (0, node_crypto.createHmac)("sha256", secret).update(AGENT_RUNTIME_IDENTITY_TOKEN_CONTEXT).update("\0").update(payload).digest("base64url");
}
function encodePayload(payload) {
	return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}
function decodeMessageActionContext(value, nowMs) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || typeof value.expiresAtMs !== "number" || !Number.isFinite(value.expiresAtMs) || nowMs >= value.expiresAtMs) return;
	const rawToolContext = value.toolContext;
	const sourceReplyFinal = value.sourceReplyFinal;
	const sourceReplyToolCallId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.sourceReplyToolCallId);
	if (sourceReplyFinal !== void 0 && typeof sourceReplyFinal !== "boolean") return;
	if (value.sourceReplyToolCallId !== void 0 && !sourceReplyToolCallId) return;
	if (rawToolContext !== void 0 && !(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(rawToolContext)) return;
	const rawCurrentChatType = rawToolContext?.currentChatType;
	const currentChatType = require_chat_type.normalizeChatType(typeof rawCurrentChatType === "string" ? rawCurrentChatType : void 0);
	const currentMessageId = rawToolContext?.currentMessageId;
	const replyToMode = rawToolContext?.replyToMode;
	const hasRepliedRef = rawToolContext?.hasRepliedRef;
	if (currentMessageId !== void 0 && typeof currentMessageId !== "string" && typeof currentMessageId !== "number" || replyToMode !== void 0 && replyToMode !== "off" && replyToMode !== "first" && replyToMode !== "all" && replyToMode !== "batched" || hasRepliedRef !== void 0 && (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(hasRepliedRef) || typeof hasRepliedRef.value !== "boolean")) return;
	const readOptionalBoolean = (key) => {
		const candidate = rawToolContext?.[key];
		return typeof candidate === "boolean" ? candidate : void 0;
	};
	const toolContext = rawToolContext ? {
		currentChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentChannelId),
		currentChatType,
		currentMessagingTarget: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentMessagingTarget),
		currentGraphChannelId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentGraphChannelId),
		currentChannelProvider: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentChannelProvider),
		currentThreadTs: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentThreadTs),
		currentMessageId,
		currentSourceTurnId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(rawToolContext.currentSourceTurnId),
		replyToMode: replyToMode === "off" || replyToMode === "first" || replyToMode === "all" || replyToMode === "batched" ? replyToMode : void 0,
		hasRepliedRef: (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(hasRepliedRef) && typeof hasRepliedRef.value === "boolean" ? { value: hasRepliedRef.value } : void 0,
		sameChannelThreadRequired: readOptionalBoolean("sameChannelThreadRequired"),
		skipCrossContextDecoration: readOptionalBoolean("skipCrossContextDecoration")
	} : void 0;
	const context = {
		expiresAtMs: value.expiresAtMs,
		sessionId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.sessionId),
		requesterAccountId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.requesterAccountId),
		requesterSenderId: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.requesterSenderId),
		toolContext
	};
	if (sourceReplyFinal === true) {
		if (!sourceReplyToolCallId) return;
		return {
			...context,
			sourceReplyFinal: true,
			sourceReplyToolCallId
		};
	}
	return {
		...context,
		...sourceReplyFinal === false ? { sourceReplyFinal: false } : {},
		...sourceReplyToolCallId ? { sourceReplyToolCallId } : {}
	};
}
function decodePayload(value, nowMs) {
	try {
		const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
		if (!parsed || typeof parsed !== "object") return;
		const raw = parsed;
		if (raw.kind !== AGENT_RUNTIME_IDENTITY_TOKEN_KIND || typeof raw.agentId !== "string" || typeof raw.sessionKey !== "string") return;
		const agentId = (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(raw.agentId);
		const sessionKey = raw.sessionKey.trim();
		if (!agentId || !sessionKey) return;
		const messageActionContext = raw.messageActionContext === void 0 ? void 0 : decodeMessageActionContext(raw.messageActionContext, nowMs);
		if (raw.messageActionContext !== void 0 && !messageActionContext) return;
		return {
			kind: AGENT_RUNTIME_IDENTITY_TOKEN_KIND,
			agentId,
			sessionKey,
			...messageActionContext ? { messageActionContext } : {}
		};
	} catch {
		return;
	}
}
/** Mint an opaque token that lets trusted local agent-tool clients identify their agent. */
async function mintAgentRuntimeIdentityToken(params) {
	if (params.messageActionContext?.sourceReplyFinal === true && !(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.messageActionContext.sourceReplyToolCallId)) throw new Error("terminal source reply requires tool-call correlation");
	const messageActionContext = params.messageActionContext ? {
		...params.messageActionContext,
		expiresAtMs: Math.min(params.messageActionContext.expiresAtMs, Date.now() + MESSAGE_ACTION_TOKEN_TTL_MS)
	} : void 0;
	const payload = encodePayload({
		kind: AGENT_RUNTIME_IDENTITY_TOKEN_KIND,
		agentId: (0, _gabrielvfonseca_normalization_core_agent_id.normalizeAgentId)(params.agentId),
		sessionKey: params.sessionKey.trim(),
		...messageActionContext ? { messageActionContext } : {}
	});
	return `${payload}.${signPayload(await requireSharedAgentRuntimeIdentitySecret(), payload)}`;
}
/** Validate a presented agent runtime token and return the internal caller identity. */
async function verifyAgentRuntimeIdentityToken(value, nowMs) {
	const token = value?.trim();
	if (!token) return;
	const [payloadPart, signature, ...extra] = token.split(".");
	if (!payloadPart || !signature || extra.length > 0) return;
	const sharedSecret = await readSharedAgentRuntimeIdentitySecret();
	if (!sharedSecret || !require_secret_equal.safeEqualSecret(signature, signPayload(sharedSecret, payloadPart))) return;
	const payload = decodePayload(payloadPart, nowMs ?? Date.now());
	if (!payload) return;
	return {
		kind: "agentRuntime",
		agentId: payload.agentId,
		sessionKey: payload.sessionKey,
		...payload.messageActionContext ? { messageActionContext: payload.messageActionContext } : {}
	};
}
//#endregion
Object.defineProperty(exports, "mintAgentRuntimeIdentityToken", {
	enumerable: true,
	get: function() {
		return mintAgentRuntimeIdentityToken;
	}
});
Object.defineProperty(exports, "verifyAgentRuntimeIdentityToken", {
	enumerable: true,
	get: function() {
		return verifyAgentRuntimeIdentityToken;
	}
});
