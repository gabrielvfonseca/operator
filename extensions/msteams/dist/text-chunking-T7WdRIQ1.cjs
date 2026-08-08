let _gabrielvfonseca_normalization_core_utf16_slice = require("@gabrielvfonseca/normalization-core/utf16-slice");
//#region src/shared/text-chunking.ts
/**
* Splits text into bounded chunks using caller-owned soft-break selection.
*
* The resolver sees each limit-sized window and returns an in-window break index;
* invalid indexes fall back to the hard limit so chunking always makes progress.
*/
function chunkTextByBreakResolver(text, limit, resolveBreakIndex) {
	if (!text) return [];
	if (limit <= 0 || text.length <= limit) return [text];
	const chunks = [];
	let remaining = text;
	while (remaining.length > limit) {
		const candidateBreak = resolveBreakIndex(remaining.slice(0, limit));
		const safeBreakIdx = (0, _gabrielvfonseca_normalization_core_utf16_slice.avoidTrailingHighSurrogateBreak)(remaining, 0, Number.isFinite(candidateBreak) && candidateBreak > 0 && candidateBreak <= limit ? candidateBreak : limit);
		const chunk = remaining.slice(0, safeBreakIdx).trimEnd();
		if (chunk.length > 0) chunks.push(chunk);
		const brokeOnSeparator = safeBreakIdx < remaining.length && /\s/.test(remaining.charAt(safeBreakIdx));
		const nextStart = Math.min(remaining.length, safeBreakIdx + (brokeOnSeparator ? 1 : 0));
		remaining = remaining.slice(nextStart).trimStart();
	}
	if (remaining.length) chunks.push(remaining);
	return chunks;
}
//#endregion
Object.defineProperty(exports, "chunkTextByBreakResolver", {
	enumerable: true,
	get: function() {
		return chunkTextByBreakResolver;
	}
});
