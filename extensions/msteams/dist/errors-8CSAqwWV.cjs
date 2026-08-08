//#region packages/agent-core/src/errors.ts
const TRANSCRIPT_NOT_CONTINUABLE_ERROR_CODE = "openclaw_transcript_not_continuable";
var TranscriptNotContinuableError = class extends Error {
	constructor(role) {
		super(`Cannot continue from message role: ${role}`);
		this.code = TRANSCRIPT_NOT_CONTINUABLE_ERROR_CODE;
		this.name = "TranscriptNotContinuableError";
		this.role = role;
	}
};
//#endregion
Object.defineProperty(exports, "TRANSCRIPT_NOT_CONTINUABLE_ERROR_CODE", {
	enumerable: true,
	get: function() {
		return TRANSCRIPT_NOT_CONTINUABLE_ERROR_CODE;
	}
});
Object.defineProperty(exports, "TranscriptNotContinuableError", {
	enumerable: true,
	get: function() {
		return TranscriptNotContinuableError;
	}
});
