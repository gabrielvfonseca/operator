//#region src/shared/transcript-only-openclaw-assistant.ts
const OPERATOR_TRANSCRIPT_ARTIFACT_API = "operator-transcript";
const OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER = "@gabrielvfonseca/operator";
const OPERATOR_DELIVERY_MIRROR_MODEL = "delivery-mirror";
const TRANSCRIPT_ONLY_OPERATOR_ASSISTANT_MODELS = /* @__PURE__ */ new Set([OPERATOR_DELIVERY_MIRROR_MODEL, "gateway-injected"]);
function isTranscriptOnlyOperatorAssistantModel(provider, model) {
	return provider === "@gabrielvfonseca/operator" && typeof model === "string" && TRANSCRIPT_ONLY_OPERATOR_ASSISTANT_MODELS.has(model);
}
function isTranscriptOnlyOperatorAssistantMessage(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return false;
	const entry = message;
	return entry.role === "assistant" && isTranscriptOnlyOperatorAssistantModel(entry.provider, entry.model);
}
function isOperatorMessageToolMirrorAssistantMessage(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return false;
	const entry = message;
	return entry.role === "assistant" && entry.operatorMessageToolMirror !== void 0;
}
function isOperatorInternalSourceReplyMirrorAssistantMessage(message) {
	if (!isOperatorMessageToolMirrorAssistantMessage(message)) return false;
	const marker = message.operatorMessageToolMirror;
	return Boolean(marker) && typeof marker === "object" && !Array.isArray(marker) && marker.sourceReplySink === "internal-ui";
}
function isOperatorDeliveryMirrorAssistantMessage(message) {
	if (!message || typeof message !== "object" || Array.isArray(message)) return false;
	const entry = message;
	return entry.role === "assistant" && entry.provider === "@gabrielvfonseca/operator" && entry.model === "delivery-mirror";
}
//#endregion
Object.defineProperty(exports, "OPERATOR_DELIVERY_MIRROR_MODEL", {
	enumerable: true,
	get: function() {
		return OPERATOR_DELIVERY_MIRROR_MODEL;
	}
});
Object.defineProperty(exports, "OPERATOR_TRANSCRIPT_ARTIFACT_API", {
	enumerable: true,
	get: function() {
		return OPERATOR_TRANSCRIPT_ARTIFACT_API;
	}
});
Object.defineProperty(exports, "OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER", {
	enumerable: true,
	get: function() {
		return OPERATOR_TRANSCRIPT_ARTIFACT_PROVIDER;
	}
});
Object.defineProperty(exports, "isOperatorDeliveryMirrorAssistantMessage", {
	enumerable: true,
	get: function() {
		return isOperatorDeliveryMirrorAssistantMessage;
	}
});
Object.defineProperty(exports, "isOperatorInternalSourceReplyMirrorAssistantMessage", {
	enumerable: true,
	get: function() {
		return isOperatorInternalSourceReplyMirrorAssistantMessage;
	}
});
Object.defineProperty(exports, "isOperatorMessageToolMirrorAssistantMessage", {
	enumerable: true,
	get: function() {
		return isOperatorMessageToolMirrorAssistantMessage;
	}
});
Object.defineProperty(exports, "isTranscriptOnlyOperatorAssistantMessage", {
	enumerable: true,
	get: function() {
		return isTranscriptOnlyOperatorAssistantMessage;
	}
});
Object.defineProperty(exports, "isTranscriptOnlyOperatorAssistantModel", {
	enumerable: true,
	get: function() {
		return isTranscriptOnlyOperatorAssistantModel;
	}
});
