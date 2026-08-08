const require_string_normalization = require("./string-normalization-yMmQ5m_u.cjs");
//#region src/plugin-sdk/approval-approvers.ts
/**
* Public SDK helper for deriving normalized approval approver ids.
*/
function dedupeDefined(values) {
	return require_string_normalization.uniqueStrings(values.filter((value) => Boolean(value)));
}
/** Resolves explicit approvers first, then allow-from/default fallbacks with dedupe. */
function resolveApprovalApprovers(params) {
	const explicit = dedupeDefined((params.explicit ?? []).map((entry) => params.normalizeApprover(entry)));
	if (explicit.length > 0) return explicit;
	return dedupeDefined([
		...(params.allowFrom ?? []).map((entry) => params.normalizeApprover(entry)),
		...(params.extraAllowFrom ?? []).map((entry) => params.normalizeApprover(entry)),
		...params.defaultTo?.trim() ? [(params.normalizeDefaultTo ?? ((value) => params.normalizeApprover(value)))(params.defaultTo.trim())] : []
	]);
}
//#endregion
//#region src/plugin-sdk/approval-auth-helpers.ts
const IMPLICIT_SAME_CHAT_APPROVAL_AUTHORIZATION = Symbol("operator.implicitSameChatApprovalAuthorization");
/**
* Marks an authorization result as the implicit same-chat fallback used when a
* channel has no configured approver allowlist.
*/
function markImplicitSameChatApprovalAuthorization(result) {
	Object.defineProperty(result, IMPLICIT_SAME_CHAT_APPROVAL_AUTHORIZATION, {
		value: true,
		enumerable: false
	});
	return result;
}
/**
* Checks whether an authorization result came from the implicit same-chat
* fallback instead of an explicitly configured approver allowlist.
*/
function isImplicitSameChatApprovalAuthorization(result) {
	return Boolean(result && result[IMPLICIT_SAME_CHAT_APPROVAL_AUTHORIZATION]);
}
function createChannelApprovalAuth(params) {
	const normalizeSenderId = params.normalizeSenderId ?? ((value) => params.normalizeApprover(value));
	const resolveApprovers = (context) => {
		return resolveApprovalApprovers({
			...params.resolveInputs(context),
			normalizeApprover: params.normalizeApprover,
			normalizeDefaultTo: params.normalizeDefaultTo
		});
	};
	const isAuthorizedSender = (context) => {
		const inputs = params.resolveInputs(context);
		const approvers = resolveApprovalApprovers({
			...inputs,
			normalizeApprover: params.normalizeApprover,
			normalizeDefaultTo: params.normalizeDefaultTo
		});
		const senderId = context.senderId ? normalizeSenderId(context.senderId) : void 0;
		if (params.isWildcardAuthorized?.({
			purpose: "sender",
			senderId,
			inputs,
			approvers
		}) === true) return true;
		return Boolean(senderId && approvers.includes(senderId));
	};
	return {
		resolveApprovers,
		isAuthorizedSender,
		approvalAuth: { authorizeActorAction(input) {
			const inputs = params.resolveInputs(input);
			const approvers = resolveApprovalApprovers({
				...inputs,
				normalizeApprover: params.normalizeApprover,
				normalizeDefaultTo: params.normalizeDefaultTo
			});
			const senderId = input.senderId ? normalizeSenderId(input.senderId) : void 0;
			if (params.isWildcardAuthorized?.({
				purpose: "action",
				senderId,
				inputs,
				approvers
			}) === true) return { authorized: true };
			if (approvers.length === 0) return markImplicitSameChatApprovalAuthorization({ authorized: true });
			if (senderId && approvers.includes(senderId)) return { authorized: true };
			return {
				authorized: false,
				reason: `❌ You are not authorized to approve ${input.approvalKind} requests on ${params.channelLabel}.`
			};
		} }
	};
}
//#endregion
Object.defineProperty(exports, "createChannelApprovalAuth", {
	enumerable: true,
	get: function() {
		return createChannelApprovalAuth;
	}
});
Object.defineProperty(exports, "isImplicitSameChatApprovalAuthorization", {
	enumerable: true,
	get: function() {
		return isImplicitSameChatApprovalAuthorization;
	}
});
