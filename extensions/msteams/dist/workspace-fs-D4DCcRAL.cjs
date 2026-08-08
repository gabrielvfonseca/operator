const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./fs-safe-BptZQDa1.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_crypto = require("node:crypto");
let _openclaw_fs_safe_root = require("@openclaw/fs-safe/root");
let _openclaw_fs_safe_errors = require("@openclaw/fs-safe/errors");
//#region src/gateway/server-methods/workspace-fs.ts
/** Shared preview cap: keeps file payloads comfortably under client WS limits. */
const WORKSPACE_PREVIEW_MAX_BYTES = 256 * 1024;
let workspaceFileUpdateQueue = Promise.resolve();
async function openWorkspaceRoot(rootDir) {
	try {
		return await (0, _openclaw_fs_safe_root.root)(rootDir, {
			hardlinks: "reject",
			maxBytes: WORKSPACE_PREVIEW_MAX_BYTES,
			nonBlockingRead: true,
			symlinks: "reject"
		});
	} catch {
		return;
	}
}
async function statWorkspacePath(rootDir, browserPath) {
	const workspaceRoot = await openWorkspaceRoot(rootDir);
	if (!workspaceRoot) return;
	try {
		return await workspaceRoot.stat(browserPath || ".");
	} catch {
		return;
	}
}
async function listWorkspacePath(rootDir, browserPath) {
	const workspaceRoot = await openWorkspaceRoot(rootDir);
	if (!workspaceRoot) return;
	try {
		return await workspaceRoot.list(browserPath || ".", { withFileTypes: true });
	} catch {
		return;
	}
}
async function readWorkspaceFile(rootDir, browserPath, opts) {
	const workspaceRoot = await openWorkspaceRoot(rootDir);
	if (!workspaceRoot) return;
	try {
		const read = await workspaceRoot.read(browserPath, {
			hardlinks: "reject",
			maxBytes: opts?.maxBytes ?? 262144,
			nonBlockingRead: true,
			symlinks: "reject"
		});
		return {
			...read,
			canonicalPath: node_path.default.relative(workspaceRoot.rootReal, read.realPath).split(node_path.default.sep).join("/")
		};
	} catch (err) {
		if (err instanceof _openclaw_fs_safe_errors.FsSafeError && err.code === "too-large") return "too-large";
		return;
	}
}
function enqueueWorkspaceFileUpdate(update) {
	const result = workspaceFileUpdateQueue.then(update, update);
	workspaceFileUpdateQueue = result.then(() => void 0, () => void 0);
	return result;
}
async function updateWorkspaceFile(rootDir, browserPath, content, expectedHash) {
	const workspaceRoot = await openWorkspaceRoot(rootDir);
	if (!workspaceRoot) return { status: "unsafe" };
	return await enqueueWorkspaceFileUpdate(async () => {
		let current;
		try {
			current = await workspaceRoot.read(browserPath, {
				hardlinks: "reject",
				maxBytes: WORKSPACE_PREVIEW_MAX_BYTES,
				nonBlockingRead: true,
				symlinks: "reject"
			});
		} catch {
			return { status: "unsafe" };
		}
		if (decodeUtf8Strict(current.buffer) === void 0) return { status: "unsafe" };
		const currentHash = (0, node_crypto.createHash)("sha256").update(current.buffer).digest("hex");
		if (currentHash !== expectedHash) return {
			status: "conflict",
			currentHash
		};
		await workspaceRoot.write(browserPath, content, {
			encoding: "utf8",
			renameIdentity: "strict"
		});
		const stat = await workspaceRoot.stat(browserPath);
		if (workspaceStatKind(stat) !== "file") return { status: "unsafe" };
		return {
			status: "updated",
			canonicalPath: node_path.default.relative(workspaceRoot.rootReal, current.realPath).split(node_path.default.sep).join("/"),
			hash: (0, node_crypto.createHash)("sha256").update(content, "utf8").digest("hex"),
			stat
		};
	});
}
function decodeUtf8Strict(buffer) {
	if (buffer.includes(0)) return;
	try {
		return new TextDecoder("utf-8", {
			fatal: true,
			ignoreBOM: true
		}).decode(buffer);
	} catch {
		return;
	}
}
/** Collapses `.` segments and separators into a canonical root-relative path. */
function normalizeRelativePath(value) {
	if (!value) return "";
	return value.replaceAll("\\", "/").split("/").filter((part) => part && part !== ".").join("/");
}
/**
* Lexical containment pre-check before any fs access; fs-safe re-verifies
* against the realpathed root so symlinked escapes still fail later.
*/
function resolveWorkspacePath(root, filePath) {
	if (!root) return;
	const resolved = node_path.default.isAbsolute(filePath) ? node_path.default.resolve(filePath) : node_path.default.resolve(root, filePath);
	const relative = node_path.default.relative(root, resolved);
	if (relative.startsWith("..") || node_path.default.isAbsolute(relative)) return;
	return resolved;
}
function workspaceStatKind(stat) {
	const kind = stat.kind;
	if (kind === "file" || kind === "directory" || kind === "symlink") return kind;
	const nodeStat = stat;
	if (typeof nodeStat.isFile === "function" ? nodeStat.isFile() : nodeStat.isFile) return "file";
	if (typeof nodeStat.isDirectory === "function" ? nodeStat.isDirectory() : nodeStat.isDirectory) return "directory";
	return (typeof nodeStat.isSymbolicLink === "function" ? nodeStat.isSymbolicLink() : nodeStat.isSymbolicLink) ? "symlink" : void 0;
}
/** Protocol timestamps are integer milliseconds. */
function toUpdatedAtMs(mtimeMs) {
	return Math.floor(mtimeMs);
}
function sortDirents(dirents) {
	return dirents.toSorted((a, b) => a.name.localeCompare(b.name));
}
/** Directories first, then name order — the shared browser display order. */
function sortWorkspaceEntries(entries) {
	return entries.toSorted((a, b) => {
		if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}
//#endregion
Object.defineProperty(exports, "WORKSPACE_PREVIEW_MAX_BYTES", {
	enumerable: true,
	get: function() {
		return WORKSPACE_PREVIEW_MAX_BYTES;
	}
});
Object.defineProperty(exports, "decodeUtf8Strict", {
	enumerable: true,
	get: function() {
		return decodeUtf8Strict;
	}
});
Object.defineProperty(exports, "listWorkspacePath", {
	enumerable: true,
	get: function() {
		return listWorkspacePath;
	}
});
Object.defineProperty(exports, "normalizeRelativePath", {
	enumerable: true,
	get: function() {
		return normalizeRelativePath;
	}
});
Object.defineProperty(exports, "readWorkspaceFile", {
	enumerable: true,
	get: function() {
		return readWorkspaceFile;
	}
});
Object.defineProperty(exports, "resolveWorkspacePath", {
	enumerable: true,
	get: function() {
		return resolveWorkspacePath;
	}
});
Object.defineProperty(exports, "sortDirents", {
	enumerable: true,
	get: function() {
		return sortDirents;
	}
});
Object.defineProperty(exports, "sortWorkspaceEntries", {
	enumerable: true,
	get: function() {
		return sortWorkspaceEntries;
	}
});
Object.defineProperty(exports, "statWorkspacePath", {
	enumerable: true,
	get: function() {
		return statWorkspacePath;
	}
});
Object.defineProperty(exports, "toUpdatedAtMs", {
	enumerable: true,
	get: function() {
		return toUpdatedAtMs;
	}
});
Object.defineProperty(exports, "updateWorkspaceFile", {
	enumerable: true,
	get: function() {
		return updateWorkspaceFile;
	}
});
Object.defineProperty(exports, "workspaceStatKind", {
	enumerable: true,
	get: function() {
		return workspaceStatKind;
	}
});
