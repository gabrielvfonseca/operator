require("./fs-safe-defaults-bWM6YSZm.cjs");
const require_replace_file = require("./replace-file-D77oDPOz.cjs");
require("@openclaw/fs-safe/advanced");
require("@openclaw/fs-safe/json");
//#region src/infra/json-files.ts
/** Writes text through the repo atomic replace helper with durable fsync by default. */
async function writeTextAtomic(filePath, content, options) {
	await require_replace_file.replaceFileAtomic({
		filePath,
		content: options?.trailingNewline && !content.endsWith("\n") ? `${content}\n` : content,
		mode: options?.mode ?? 384,
		dirMode: options?.dirMode ?? 511 & ~process.umask(),
		copyFallbackOnPermissionError: true,
		syncTempFile: options?.durable !== false,
		syncParentDir: options?.durable !== false,
		...options?.beforeRename ? { beforeRename: options.beforeRename } : {},
		...options?.tempPrefix ? { tempPrefix: options.tempPrefix } : {}
	});
}
//#endregion
Object.defineProperty(exports, "writeTextAtomic", {
	enumerable: true,
	get: function() {
		return writeTextAtomic;
	}
});
