//#region src/auto-reply/reply/inbound-text.ts
/** Normalizes real inbound newline characters while preserving literal escape text. */
function normalizeInboundTextNewlines(input) {
	return input.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}
//#endregion
Object.defineProperty(exports, "normalizeInboundTextNewlines", {
	enumerable: true,
	get: function() {
		return normalizeInboundTextNewlines;
	}
});
