let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/commands-reset-mode.ts
function parseSoftResetCommand(commandBodyNormalized) {
	const resetMatch = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(commandBodyNormalized).match(/^\/reset(?:\s|$)/);
	if (!resetMatch) return { matched: false };
	const rest = commandBodyNormalized.slice(resetMatch[0].length).trimStart();
	if (!rest) return { matched: false };
	const restLower = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(rest);
	const softMatch = restLower.match(/^soft(?:\s|$)/);
	if (!softMatch) return { matched: false };
	if (restLower === "soft") return {
		matched: true,
		tail: ""
	};
	return {
		matched: true,
		tail: rest.slice(softMatch[0].length).trimStart()
	};
}
//#endregion
Object.defineProperty(exports, "parseSoftResetCommand", {
	enumerable: true,
	get: function() {
		return parseSoftResetCommand;
	}
});
