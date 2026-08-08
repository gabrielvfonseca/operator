const require_account_id = require("./account-id-Di7YWYh4.cjs");
require("./session-key-BQFkCTNx.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/outbound/session-binding-normalization.ts
/**
* Normalizes conversation ids and drops self-referential parent ids.
*/
function normalizeConversationTargetRef(ref) {
	const conversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ref.conversationId) ?? "";
	const parentConversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(ref.parentConversationId);
	const { parentConversationId: _ignoredParentConversationId, ...rest } = ref;
	return {
		...rest,
		conversationId,
		...parentConversationId && parentConversationId !== conversationId ? { parentConversationId } : {}
	};
}
/**
* Normalizes a full conversation reference for stable binding keys.
*/
function normalizeConversationRef(ref) {
	return {
		...normalizeConversationTargetRef(ref),
		channel: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(ref.channel),
		accountId: require_account_id.normalizeAccountId(ref.accountId)
	};
}
/**
* Builds the adapter registry key shared by channel/account scoped bindings.
*/
function buildChannelAccountKey(params) {
	return `${(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(params.channel)}:${require_account_id.normalizeAccountId(params.accountId)}`;
}
//#endregion
Object.defineProperty(exports, "buildChannelAccountKey", {
	enumerable: true,
	get: function() {
		return buildChannelAccountKey;
	}
});
Object.defineProperty(exports, "normalizeConversationRef", {
	enumerable: true,
	get: function() {
		return normalizeConversationRef;
	}
});
Object.defineProperty(exports, "normalizeConversationTargetRef", {
	enumerable: true,
	get: function() {
		return normalizeConversationTargetRef;
	}
});
