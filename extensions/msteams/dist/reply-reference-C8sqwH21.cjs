require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/auto-reply/reply/reply-reference.ts
/** Plans reply/thread references for multi-payload channel sends. */
/** Returns true for modes that use a reply reference only before the first send. */
function isSingleUseReplyToMode(mode) {
	return mode === "first" || mode === "batched";
}
//#endregion
Object.defineProperty(exports, "isSingleUseReplyToMode", {
	enumerable: true,
	get: function() {
		return isSingleUseReplyToMode;
	}
});
