const require_payload = require("./payload-CpwK2DJY.cjs");
const require_reply_payload = require("./reply-payload-B-1jXr3E.cjs");
const require_tokens = require("./tokens-DMN4UzIu.cjs");
const require_sanitize_user_facing_text = require("./sanitize-user-facing-text-B2i4WcAm.cjs");
const require_heartbeat = require("./heartbeat-B6M3DHWg.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/response-prefix-template.ts
const TEMPLATE_VAR_PATTERN = /\{([a-zA-Z][a-zA-Z0-9.]*)\}/g;
/**
* Interpolate template variables in a response prefix string.
*
* @param template - The template string with `{variable}` placeholders
* @param context - Context object with values for interpolation
* @returns The interpolated string, or undefined if template is undefined
*
* @example
* resolveResponsePrefixTemplate("[{model} | think:{thinkingLevel}]", {
*   model: "gpt-5.4",
*   thinkingLevel: "high"
* })
* // Returns: "[gpt-5.4 | think:high]"
*/
function resolveResponsePrefixTemplate(template, context) {
	if (!template) return;
	return template.replace(TEMPLATE_VAR_PATTERN, (match, varName) => {
		switch ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(varName)) {
			case "model": return context.model ?? match;
			case "modelfull": return context.modelFull ?? match;
			case "provider": return context.provider ?? match;
			case "thinkinglevel":
			case "think": return context.thinkingLevel ?? match;
			case "identity.name":
			case "identityname": return context.identityName ?? match;
			default: return match;
		}
	});
}
/**
* Extract short model name from a full model string.
*
* Strips:
* - Provider prefix (e.g., "openai/" from "openai/gpt-5.4")
* - Date suffixes (e.g., "-20260205" from "claude-opus-4-6-20260205")
* - Common version suffixes (e.g., "-latest")
*
* @example
* extractShortModelName("openai/gpt-5.6-sol") // "gpt-5.6-sol"
* extractShortModelName("claude-opus-4-6-20260205") // "claude-opus-4-6"
* extractShortModelName("gpt-5.4-latest") // "gpt-5.4"
*/
function extractShortModelName(fullModel) {
	const slash = fullModel.lastIndexOf("/");
	return (slash >= 0 ? fullModel.slice(slash + 1) : fullModel).replace(/-\d{8}$/, "").replace(/-latest$/, "");
}
//#endregion
//#region src/auto-reply/reply/normalize-reply.ts
function normalizeReplyPayload(payload, opts = {}) {
	const applyChannelTransforms = opts.applyChannelTransforms ?? true;
	const hasContent = (text) => require_payload.hasReplyPayloadContent({
		...payload,
		text
	}, { trimText: true });
	const trimmed = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.text) ?? "";
	if (!hasContent(trimmed)) {
		opts.onSkip?.("empty");
		return null;
	}
	const silentToken = opts.silentToken ?? "NO_REPLY";
	let text = payload.text ?? void 0;
	if (text && require_tokens.isSilentReplyPayloadText(text, silentToken)) {
		if (!hasContent("")) {
			opts.onSkip?.("silent");
			return null;
		}
		text = "";
	}
	if (text && !require_tokens.isSilentReplyText(text, silentToken)) {
		const hasLeadingSilentToken = require_tokens.startsWithSilentToken(text, silentToken);
		if (hasLeadingSilentToken) text = require_tokens.stripLeadingSilentToken(text, silentToken);
		if (hasLeadingSilentToken || text.toLowerCase().includes(silentToken.toLowerCase())) {
			text = require_tokens.stripSilentToken(text, silentToken);
			if (!hasContent(text)) {
				opts.onSkip?.("silent");
				return null;
			}
		}
	}
	if (text && !trimmed) text = "";
	if ((opts.stripHeartbeat ?? true) && text?.includes("HEARTBEAT_OK")) {
		const stripped = require_heartbeat.stripHeartbeatToken(text, { mode: "message" });
		if (stripped.didStrip) opts.onHeartbeatStrip?.();
		if (stripped.shouldSkip && !hasContent(stripped.text)) {
			opts.onSkip?.("heartbeat");
			return null;
		}
		text = stripped.text;
	}
	if (text && require_tokens.isInternalFormattingArtifact(text) && !hasContent("")) {
		opts.onSkip?.("silent");
		return null;
	}
	if (text) text = require_sanitize_user_facing_text.sanitizeUserFacingText(text, { errorContext: Boolean(payload.isError) });
	if (!hasContent(text)) {
		opts.onSkip?.("empty");
		return null;
	}
	let enrichedPayload = require_reply_payload.copyReplyPayloadMetadata(payload, {
		...payload,
		text
	});
	if (applyChannelTransforms && opts.transformReplyPayload) {
		const transformedPayload = opts.transformReplyPayload(enrichedPayload);
		if (transformedPayload === null) return null;
		enrichedPayload = transformedPayload ? require_reply_payload.copyReplyPayloadMetadata(enrichedPayload, transformedPayload) : enrichedPayload;
		text = enrichedPayload.text;
	}
	const effectivePrefix = opts.responsePrefixContext ? resolveResponsePrefixTemplate(opts.responsePrefix, opts.responsePrefixContext) : opts.responsePrefix;
	if (effectivePrefix && text && text.trim() !== "HEARTBEAT_OK" && !text.startsWith(effectivePrefix)) text = `${effectivePrefix} ${text}`;
	enrichedPayload = require_reply_payload.copyReplyPayloadMetadata(enrichedPayload, {
		...enrichedPayload,
		text
	});
	return enrichedPayload;
}
//#endregion
Object.defineProperty(exports, "extractShortModelName", {
	enumerable: true,
	get: function() {
		return extractShortModelName;
	}
});
Object.defineProperty(exports, "normalizeReplyPayload", {
	enumerable: true,
	get: function() {
		return normalizeReplyPayload;
	}
});
Object.defineProperty(exports, "resolveResponsePrefixTemplate", {
	enumerable: true,
	get: function() {
		return resolveResponsePrefixTemplate;
	}
});
