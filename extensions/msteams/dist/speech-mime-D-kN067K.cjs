let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/gateway/server-methods/speech-mime.ts
function inferSpeechMimeType(outputFormat, fileExtension) {
	const normalizedOutput = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(outputFormat);
	const normalizedExtension = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalLowercaseString)(fileExtension);
	if (normalizedOutput === "mp3" || normalizedOutput?.startsWith("mp3_") || normalizedOutput?.endsWith("-mp3") || normalizedExtension === ".mp3") return "audio/mpeg";
	if (normalizedOutput === "opus" || normalizedOutput?.startsWith("opus_") || normalizedExtension === ".opus" || normalizedExtension === ".ogg") return "audio/ogg";
	if (normalizedOutput?.endsWith("-wav") || normalizedExtension === ".wav") return "audio/wav";
	if (normalizedOutput?.endsWith("-webm") || normalizedExtension === ".webm") return "audio/webm";
}
//#endregion
Object.defineProperty(exports, "inferSpeechMimeType", {
	enumerable: true,
	get: function() {
		return inferSpeechMimeType;
	}
});
