const require_account_id = require("./account-id-Di7YWYh4.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_crypto = require("node:crypto");
//#region src/auto-reply/reply/source-turn-id.ts
const CHANNEL_SOURCE_TURN_ID_PREFIX = "channel-user:v1:";
const CHANNEL_SOURCE_TURN_ID = Symbol("operator.channelSourceTurnId");
const CHANNEL_SOURCE_TURN_SAME_THREAD_REQUIRED = Symbol("operator.channelSourceTurnSameThreadRequired");
/**
* Identifies one inbound channel turn across shared sessions.
* Provider message ids are not globally unique, so route scope is mandatory.
*/
function buildChannelSourceTurnId(params) {
	const provider = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.provider);
	const conversationId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(params.conversationId);
	const messageId = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(typeof params.messageId === "number" ? String(params.messageId) : params.messageId);
	if (!provider || !conversationId || !messageId) return;
	const digest = (0, node_crypto.createHash)("sha256").update(JSON.stringify([
		provider,
		require_account_id.normalizeAccountId(params.accountId),
		conversationId,
		messageId
	])).digest("hex");
	return `${CHANNEL_SOURCE_TURN_ID_PREFIX}${digest}`;
}
/** Carries host-only source identity through internal context clones without public type drift. */
function setChannelSourceTurnId(context, sourceTurnId) {
	const scoped = context;
	if (sourceTurnId) scoped[CHANNEL_SOURCE_TURN_ID] = sourceTurnId;
	else delete scoped[CHANNEL_SOURCE_TURN_ID];
}
function readChannelSourceTurnId(context) {
	return context[CHANNEL_SOURCE_TURN_ID];
}
/** Carries the original channel adapter's narrowed message-action scope privately. */
function setChannelSourceTurnSameThreadRequired(context, sameThreadRequired) {
	const scoped = context;
	if (sameThreadRequired === true) scoped[CHANNEL_SOURCE_TURN_SAME_THREAD_REQUIRED] = true;
	else delete scoped[CHANNEL_SOURCE_TURN_SAME_THREAD_REQUIRED];
}
function readChannelSourceTurnSameThreadRequired(context) {
	return context[CHANNEL_SOURCE_TURN_SAME_THREAD_REQUIRED] === true;
}
//#endregion
Object.defineProperty(exports, "buildChannelSourceTurnId", {
	enumerable: true,
	get: function() {
		return buildChannelSourceTurnId;
	}
});
Object.defineProperty(exports, "readChannelSourceTurnId", {
	enumerable: true,
	get: function() {
		return readChannelSourceTurnId;
	}
});
Object.defineProperty(exports, "readChannelSourceTurnSameThreadRequired", {
	enumerable: true,
	get: function() {
		return readChannelSourceTurnSameThreadRequired;
	}
});
Object.defineProperty(exports, "setChannelSourceTurnId", {
	enumerable: true,
	get: function() {
		return setChannelSourceTurnId;
	}
});
Object.defineProperty(exports, "setChannelSourceTurnSameThreadRequired", {
	enumerable: true,
	get: function() {
		return setChannelSourceTurnSameThreadRequired;
	}
});
