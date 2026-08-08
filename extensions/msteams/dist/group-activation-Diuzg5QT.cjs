let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/group-activation.ts
/** Normalize a raw group activation mode string. */
function normalizeGroupActivation(raw) {
	const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(raw);
	if (value === "mention") return "mention";
	if (value === "always") return "always";
}
/** Parse `/activation` commands from inbound message text. */
function parseActivationCommand(raw) {
	if (!raw) return { hasCommand: false };
	const trimmed = raw.trim();
	if (!trimmed) return { hasCommand: false };
	const match = trimmed.replace(/^\/([^\s:]+)\s*:(.*)$/, (_, cmd, rest) => {
		const trimmedRest = rest.trimStart();
		return trimmedRest ? `/${cmd} ${trimmedRest}` : `/${cmd}`;
	}).match(/^\/activation(?:\s+([a-zA-Z]+))?\s*$/i);
	if (!match) return { hasCommand: false };
	return {
		hasCommand: true,
		mode: normalizeGroupActivation(match[1])
	};
}
//#endregion
Object.defineProperty(exports, "normalizeGroupActivation", {
	enumerable: true,
	get: function() {
		return normalizeGroupActivation;
	}
});
Object.defineProperty(exports, "parseActivationCommand", {
	enumerable: true,
	get: function() {
		return parseActivationCommand;
	}
});
