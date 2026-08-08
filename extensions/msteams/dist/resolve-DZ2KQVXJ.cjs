const require_chat_type = require("./chat-type-JbYXFZG-.cjs");
const require_globals = require("./globals-D7PiAd5y.cjs");
const require_defaults_constants = require("./defaults.constants-BV5EBB5p.cjs");
const require_entry_capabilities = require("./entry-capabilities-By50OsTu.cjs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/media-understanding/scope.ts
function normalizeDecision(value) {
	const normalized = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(value);
	if (normalized === "allow") return "allow";
	if (normalized === "deny") return "deny";
}
/** Normalizes channel/direct chat type aliases used by media-understanding scope rules. */
function normalizeMediaUnderstandingChatType(raw) {
	return require_chat_type.normalizeChatType(raw ?? void 0);
}
/** Evaluates ordered media-understanding scope rules against channel, chat type, and session key. */
function resolveMediaUnderstandingScope(params) {
	const scope = params.scope;
	if (!scope) return "allow";
	const channel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.channel);
	const chatType = normalizeMediaUnderstandingChatType(params.chatType);
	const sessionKey = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(params.sessionKey) ?? "";
	for (const rule of scope.rules ?? []) {
		if (!rule) continue;
		const action = normalizeDecision(rule.action) ?? "allow";
		const match = rule.match ?? {};
		const matchChannel = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(match.channel);
		const matchChatType = normalizeMediaUnderstandingChatType(match.chatType);
		const matchPrefix = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(match.keyPrefix);
		if (matchChannel && matchChannel !== channel) continue;
		if (matchChatType && matchChatType !== chatType) continue;
		if (matchPrefix && !sessionKey.startsWith(matchPrefix)) continue;
		return action;
	}
	return normalizeDecision(scope.default) ?? "allow";
}
//#endregion
//#region src/media-understanding/resolve.ts
const MIN_MEDIA_TIMEOUT_MS = 1e3;
/** Converts configured timeout seconds into a timer-safe millisecond deadline. */
function resolveTimeoutMs(seconds, fallbackSeconds) {
	const value = typeof seconds === "number" && Number.isFinite(seconds) ? seconds : fallbackSeconds;
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return MIN_MEDIA_TIMEOUT_MS;
	const timeoutMs = Math.floor(value * 1e3);
	return (0, _gabrielvfonseca_normalization_core_number_coercion.resolveTimerTimeoutMs)(Number.isFinite(timeoutMs) ? timeoutMs : _gabrielvfonseca_normalization_core_number_coercion.MAX_TIMER_TIMEOUT_MS, MIN_MEDIA_TIMEOUT_MS, MIN_MEDIA_TIMEOUT_MS);
}
/** Resolves the provider prompt and appends length guidance for non-audio outputs. */
function resolvePrompt(capability, prompt, maxChars) {
	const base = prompt?.trim() || require_defaults_constants.DEFAULT_PROMPT[capability];
	if (!maxChars || capability === "audio") return base;
	return `${base} Respond in at most ${maxChars} characters.`;
}
/** Resolves the effective max response characters for a model entry and capability. */
function resolveMaxChars(params) {
	const { capability, entry, cfg } = params;
	const configured = entry.maxChars ?? params.config?.maxChars ?? cfg.tools?.media?.[capability]?.maxChars;
	if (typeof configured === "number") return configured;
	return require_defaults_constants.DEFAULT_MAX_CHARS_BY_CAPABILITY[capability];
}
/** Resolves the effective input byte cap for a model entry and capability. */
function resolveMaxBytes(params) {
	const configured = params.entry.maxBytes ?? params.config?.maxBytes ?? params.cfg.tools?.media?.[params.capability]?.maxBytes;
	if (typeof configured === "number") return configured;
	return require_defaults_constants.DEFAULT_MAX_BYTES[params.capability];
}
/** Maps the message context to an allow/deny decision for configured media scope rules. */
function resolveScopeDecision(params) {
	return resolveMediaUnderstandingScope({
		scope: params.scope,
		sessionKey: params.ctx.SessionKey,
		channel: params.ctx.Surface ?? params.ctx.Provider,
		chatType: normalizeMediaUnderstandingChatType(params.ctx.ChatType)
	});
}
/** Resolves configured model entries that can handle the requested media capability. */
function resolveModelEntries(params) {
	const { cfg, capability, config } = params;
	const sharedModels = cfg.tools?.media?.models ?? [];
	const entries = [...(config?.models ?? []).map((entry) => ({
		entry,
		source: "capability"
	})), ...sharedModels.map((entry) => ({
		entry,
		source: "shared"
	}))];
	if (entries.length === 0) return [];
	return entries.filter(({ entry, source }) => {
		const caps = require_entry_capabilities.resolveEffectiveMediaEntryCapabilities({
			entry,
			source,
			providerRegistry: params.providerRegistry
		});
		if (!caps || caps.length === 0) {
			if (source === "shared") {
				if (require_globals.shouldLogVerbose()) require_globals.logVerbose(`Skipping shared media model without capabilities: ${entry.provider ?? entry.command ?? "unknown"}`);
				return false;
			}
			return true;
		}
		return caps.includes(capability);
	}).map(({ entry }) => entry);
}
/** Resolves the bounded media-understanding task concurrency from config. */
function resolveConcurrency(cfg) {
	const configured = cfg.tools?.media?.concurrency;
	if (typeof configured === "number" && Number.isFinite(configured) && configured > 0) return Math.floor(configured);
	return 2;
}
//#endregion
Object.defineProperty(exports, "normalizeMediaUnderstandingChatType", {
	enumerable: true,
	get: function() {
		return normalizeMediaUnderstandingChatType;
	}
});
Object.defineProperty(exports, "resolveConcurrency", {
	enumerable: true,
	get: function() {
		return resolveConcurrency;
	}
});
Object.defineProperty(exports, "resolveMaxBytes", {
	enumerable: true,
	get: function() {
		return resolveMaxBytes;
	}
});
Object.defineProperty(exports, "resolveMaxChars", {
	enumerable: true,
	get: function() {
		return resolveMaxChars;
	}
});
Object.defineProperty(exports, "resolveMediaUnderstandingScope", {
	enumerable: true,
	get: function() {
		return resolveMediaUnderstandingScope;
	}
});
Object.defineProperty(exports, "resolveModelEntries", {
	enumerable: true,
	get: function() {
		return resolveModelEntries;
	}
});
Object.defineProperty(exports, "resolvePrompt", {
	enumerable: true,
	get: function() {
		return resolvePrompt;
	}
});
Object.defineProperty(exports, "resolveScopeDecision", {
	enumerable: true,
	get: function() {
		return resolveScopeDecision;
	}
});
Object.defineProperty(exports, "resolveTimeoutMs", {
	enumerable: true,
	get: function() {
		return resolveTimeoutMs;
	}
});
