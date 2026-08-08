require("./plugins-_-82JYfc.cjs");
const require_registry = require("./registry-raOBfWNF.cjs");
const require_outbound_policy = require("./outbound-policy-C_vceK9z.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/agents/embedded-agent-messaging.ts
/**
* Identifies messaging tools and send actions during embedded-agent runs.
*/
const CORE_MESSAGING_TOOLS = /* @__PURE__ */ new Set(["sessions_send", "message"]);
const MESSAGE_TOOL_SEND_ACTIONS = /* @__PURE__ */ new Set([
	"send",
	"thread-reply",
	"sendWithEffect",
	"sendAttachment",
	"upload-file"
]);
const MESSAGE_TOOL_READ_ONLY_ACTIONS = /* @__PURE__ */ new Set([
	"read",
	"reactions",
	"list-pins",
	"permissions",
	"thread-list",
	"search",
	"sticker-search",
	"member-info",
	"role-info",
	"emoji-list",
	"channel-info",
	"channel-list",
	"voice-status",
	"event-list",
	"download-file"
]);
const MESSAGE_TOOL_MUTATION_ACTIONS = new Set(require_outbound_policy.CHANNEL_MESSAGE_ACTION_NAMES.filter((action) => !MESSAGE_TOOL_READ_ONLY_ACTIONS.has(action)));
const MESSAGE_TOOL_CONVERSATION_CREATE_ACTIONS = /* @__PURE__ */ new Set([
	"thread-create",
	"topic-create",
	"threadcreate",
	"createforumtopic"
]);
/** Return true when a message action sends or uploads user-visible content. */
function isMessageToolSendActionName(action) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(action) ?? "";
	return MESSAGE_TOOL_SEND_ACTIONS.has(normalized);
}
/** Return true when a message action creates a visible destination conversation. */
function isMessageToolConversationCreateActionName(action) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(action)?.toLowerCase() ?? "";
	return MESSAGE_TOOL_CONVERSATION_CREATE_ACTIONS.has(normalized);
}
/** Return true for core or channel-plugin messaging tool names. */
function isMessagingTool(toolName) {
	if (CORE_MESSAGING_TOOLS.has(toolName)) return true;
	const providerId = require_registry.normalizeChannelId(toolName);
	return Boolean(providerId && require_registry.getChannelPlugin(providerId)?.actions);
}
/** Return true when the specific tool invocation is an outbound send. */
function isMessagingToolSendAction(toolName, args) {
	const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.action) ?? "";
	if (toolName === "sessions_send") return true;
	if (toolName === "message") return isMessageToolSendActionName(action);
	const providerId = require_registry.normalizeChannelId(toolName);
	return Boolean(providerId && require_registry.getChannelPlugin(providerId)?.actions?.extractToolSend?.({ args })?.to);
}
/** Return true when a visible delivery has one target worth recording as evidence. */
function isMessagingToolTargetEvidenceAction(toolName, args) {
	if (toolName === "message") {
		const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.action) ?? "";
		return require_outbound_policy.shouldApplyCrossContextMarker(action) || isMessageToolConversationCreateActionName(action);
	}
	return isMessagingToolSendAction(toolName, args);
}
/** Return true when a messaging invocation can create visible outbound delivery. */
function isMessagingToolDeliveryAction(toolName, args) {
	if (toolName === "message") {
		const action = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(args.action) ?? "";
		return MESSAGE_TOOL_MUTATION_ACTIONS.has(action) || isMessageToolConversationCreateActionName(action);
	}
	const providerId = require_registry.normalizeChannelId(toolName);
	if (providerId && require_registry.getChannelPlugin(providerId)?.actions?.isToolDeliveryAction?.({ args })) return true;
	return isMessagingToolSendAction(toolName, args);
}
//#endregion
Object.defineProperty(exports, "isMessageToolConversationCreateActionName", {
	enumerable: true,
	get: function() {
		return isMessageToolConversationCreateActionName;
	}
});
Object.defineProperty(exports, "isMessageToolSendActionName", {
	enumerable: true,
	get: function() {
		return isMessageToolSendActionName;
	}
});
Object.defineProperty(exports, "isMessagingTool", {
	enumerable: true,
	get: function() {
		return isMessagingTool;
	}
});
Object.defineProperty(exports, "isMessagingToolDeliveryAction", {
	enumerable: true,
	get: function() {
		return isMessagingToolDeliveryAction;
	}
});
Object.defineProperty(exports, "isMessagingToolSendAction", {
	enumerable: true,
	get: function() {
		return isMessagingToolSendAction;
	}
});
Object.defineProperty(exports, "isMessagingToolTargetEvidenceAction", {
	enumerable: true,
	get: function() {
		return isMessagingToolTargetEvidenceAction;
	}
});
