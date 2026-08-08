const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-defaults-bWM6YSZm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _openclaw_fs_safe_atomic = require("@openclaw/fs-safe/atomic");
//#region src/infra/replace-file.ts
/** Atomic file replacement primitive re-exported through the fs-safe defaults shim. */
const replaceFileAtomic = _openclaw_fs_safe_atomic.replaceFileAtomic;
/**
* Moves a path using fs-safe's copy fallback, with an Operator hardlink guard
* for install/update flows that must not preserve package-manager links.
*/
async function movePathWithCopyFallback(options) {
	if (options.sourceHardlinks === "reject") await assertNoHardlinkedSourceFiles(options.from);
	await (0, _openclaw_fs_safe_atomic.movePathWithCopyFallback)({
		from: options.from,
		to: options.to
	});
}
async function assertNoHardlinkedSourceFiles(sourcePath) {
	const sourceStat = await node_fs_promises.default.lstat(sourcePath);
	if (sourceStat.isFile() && sourceStat.nlink > 1) throw new Error(`Hardlinked source file is not allowed: ${sourcePath}`);
	if (!sourceStat.isDirectory()) return;
	const entries = await node_fs_promises.default.readdir(sourcePath, { withFileTypes: true });
	await Promise.all(entries.map(async (entry) => {
		const entryPath = node_path.default.join(sourcePath, entry.name);
		if (entry.isDirectory()) {
			await assertNoHardlinkedSourceFiles(entryPath);
			return;
		}
		if (!entry.isFile()) return;
		if ((await node_fs_promises.default.lstat(entryPath)).nlink > 1) throw new Error(`Hardlinked source file is not allowed: ${entryPath}`);
	}));
}
//#endregion
Object.defineProperty(exports, "movePathWithCopyFallback", {
	enumerable: true,
	get: function() {
		return movePathWithCopyFallback;
	}
});
Object.defineProperty(exports, "replaceFileAtomic", {
	enumerable: true,
	get: function() {
		return replaceFileAtomic;
	}
});
