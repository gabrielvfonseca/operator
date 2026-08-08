//#region packages/gateway-protocol/src/terminal-upload-constants.ts
/** Maximum size of one file staged through the operator terminal. */
const MAX_TERMINAL_UPLOAD_BYTES = 16 * 1024 * 1024;
/** Base64 expansion of MAX_TERMINAL_UPLOAD_BYTES. */
const MAX_TERMINAL_UPLOAD_BASE64_LENGTH = Math.ceil(MAX_TERMINAL_UPLOAD_BYTES / 3) * 4;
function base64Value(code) {
	if (code >= 65 && code <= 90) return code - 65;
	if (code >= 97 && code <= 122) return code - 71;
	if (code >= 48 && code <= 57) return code + 4;
	return code === 43 ? 62 : code === 47 ? 63 : -1;
}
function terminalUploadDecodedSize(contentBase64) {
	if (contentBase64.length === 0) return 0;
	const padding = contentBase64.endsWith("==") ? 2 : contentBase64.endsWith("=") ? 1 : 0;
	return Math.floor(contentBase64.length / 4) * 3 - padding;
}
/** Validates canonical padded base64, including zero-valued unused bits. */
function isCanonicalTerminalUploadBase64(contentBase64) {
	if (contentBase64.length > MAX_TERMINAL_UPLOAD_BASE64_LENGTH || contentBase64.length % 4 !== 0 || terminalUploadDecodedSize(contentBase64) > 16777216) return false;
	const padding = contentBase64.endsWith("==") ? 2 : contentBase64.endsWith("=") ? 1 : 0;
	const dataEnd = contentBase64.length - padding;
	for (let index = 0; index < dataEnd; index += 1) if (base64Value(contentBase64.charCodeAt(index)) < 0) return false;
	for (let index = dataEnd; index < contentBase64.length; index += 1) if (contentBase64.charCodeAt(index) !== 61) return false;
	if (padding > 0) {
		const finalValue = base64Value(contentBase64.charCodeAt(dataEnd - 1));
		if (finalValue < 0 || (finalValue & (padding === 2 ? 15 : 3)) !== 0) return false;
	}
	return true;
}
//#endregion
Object.defineProperty(exports, "MAX_TERMINAL_UPLOAD_BASE64_LENGTH", {
	enumerable: true,
	get: function() {
		return MAX_TERMINAL_UPLOAD_BASE64_LENGTH;
	}
});
Object.defineProperty(exports, "MAX_TERMINAL_UPLOAD_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_TERMINAL_UPLOAD_BYTES;
	}
});
Object.defineProperty(exports, "isCanonicalTerminalUploadBase64", {
	enumerable: true,
	get: function() {
		return isCanonicalTerminalUploadBase64;
	}
});
Object.defineProperty(exports, "terminalUploadDecodedSize", {
	enumerable: true,
	get: function() {
		return terminalUploadDecodedSize;
	}
});
