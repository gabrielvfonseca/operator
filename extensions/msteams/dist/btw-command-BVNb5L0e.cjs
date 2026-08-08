const require_commands_registry_normalize = require("./commands-registry-normalize-Bo5SeH8X.cjs");
require("./commands-registry-BvZ3TCTG.cjs");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/btw-command.ts
const BTW_COMMAND_RE = /^\/btw(?::|\s|$)/i;
function isBtwRequestText(text, options) {
	if (!text) return false;
	const normalized = require_commands_registry_normalize.normalizeCommandBody(text, options).trim();
	return BTW_COMMAND_RE.test(normalized);
}
function extractBtwQuestion(text, options) {
	if (!text) return null;
	const match = require_commands_registry_normalize.normalizeCommandBody(text, options).trim().match(/^\/btw(?:\s+(.*))?$/i);
	if (!match) return null;
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(match[1]) ?? "";
}
//#endregion
Object.defineProperty(exports, "extractBtwQuestion", {
	enumerable: true,
	get: function() {
		return extractBtwQuestion;
	}
});
Object.defineProperty(exports, "isBtwRequestText", {
	enumerable: true,
	get: function() {
		return isBtwRequestText;
	}
});
