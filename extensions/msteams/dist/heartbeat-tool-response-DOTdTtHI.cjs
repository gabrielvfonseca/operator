const require_string_readers = require("./string-readers-DjRuUveR.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/heartbeat-tool-response.ts
/** Tool name used by heartbeat runs to report visible or silent progress. */
const HEARTBEAT_RESPONSE_TOOL_NAME = "heartbeat_respond";
const HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY = "openclawHeartbeatResponse";
/** Allowed heartbeat response outcomes. */
const HEARTBEAT_TOOL_OUTCOMES = [
	"no_change",
	"progress",
	"done",
	"blocked",
	"needs_attention"
];
/** Allowed heartbeat notification priorities. */
const HEARTBEAT_TOOL_PRIORITIES = [
	"low",
	"normal",
	"high"
];
const OUTCOMES = new Set(HEARTBEAT_TOOL_OUTCOMES);
const PRIORITIES = new Set(HEARTBEAT_TOOL_PRIORITIES);
function readBooleanAlias(record, ...keys) {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "boolean") return value;
	}
}
/** Validate and normalize unknown heartbeat tool output. */
function normalizeHeartbeatToolResponse(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value)) return;
	const outcome = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.outcome);
	const notify = readBooleanAlias(value, "notify");
	const summary = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.summary);
	if (!outcome || !OUTCOMES.has(outcome) || notify === void 0 || !summary) return;
	const priority = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.priority);
	const notificationText = require_string_readers.readTrimmedStringAlias(value, ["notificationText", "notification_text"]);
	const reason = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(value.reason);
	const nextCheck = require_string_readers.readTrimmedStringAlias(value, ["nextCheck", "next_check"]);
	return {
		outcome,
		notify,
		summary,
		...notificationText ? { notificationText } : {},
		...reason ? { reason } : {},
		...priority && PRIORITIES.has(priority) ? { priority } : {},
		...nextCheck ? { nextCheck } : {}
	};
}
/** Resolve the user-visible notification text for a heartbeat response. */
function getHeartbeatToolNotificationText(response) {
	return response.notify ? (response.notificationText ?? response.summary).trim() : "";
}
/** Store a heartbeat tool response in reply channel data for later extraction. */
function createHeartbeatToolResponsePayload(response) {
	return {
		text: response.notify ? getHeartbeatToolNotificationText(response) : require_tokens.HEARTBEAT_TOKEN,
		channelData: { [HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY]: response }
	};
}
function getHeartbeatToolResponseFromPayload(payload) {
	return normalizeHeartbeatToolResponse(payload?.channelData?.[HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY]);
}
/** Find the last heartbeat tool response embedded in a reply result. */
function resolveHeartbeatToolResponseFromReplyResult(replyResult) {
	if (!replyResult) return;
	const payloads = Array.isArray(replyResult) ? replyResult : [replyResult];
	for (let idx = payloads.length - 1; idx >= 0; idx -= 1) {
		const response = getHeartbeatToolResponseFromPayload(payloads[idx]);
		if (response) return response;
	}
}
//#endregion
Object.defineProperty(exports, "HEARTBEAT_RESPONSE_TOOL_NAME", {
	enumerable: true,
	get: function() {
		return HEARTBEAT_RESPONSE_TOOL_NAME;
	}
});
Object.defineProperty(exports, "HEARTBEAT_TOOL_OUTCOMES", {
	enumerable: true,
	get: function() {
		return HEARTBEAT_TOOL_OUTCOMES;
	}
});
Object.defineProperty(exports, "HEARTBEAT_TOOL_PRIORITIES", {
	enumerable: true,
	get: function() {
		return HEARTBEAT_TOOL_PRIORITIES;
	}
});
Object.defineProperty(exports, "createHeartbeatToolResponsePayload", {
	enumerable: true,
	get: function() {
		return createHeartbeatToolResponsePayload;
	}
});
Object.defineProperty(exports, "getHeartbeatToolNotificationText", {
	enumerable: true,
	get: function() {
		return getHeartbeatToolNotificationText;
	}
});
Object.defineProperty(exports, "normalizeHeartbeatToolResponse", {
	enumerable: true,
	get: function() {
		return normalizeHeartbeatToolResponse;
	}
});
Object.defineProperty(exports, "resolveHeartbeatToolResponseFromReplyResult", {
	enumerable: true,
	get: function() {
		return resolveHeartbeatToolResponseFromReplyResult;
	}
});
