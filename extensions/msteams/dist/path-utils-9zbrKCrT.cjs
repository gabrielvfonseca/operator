const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/sandbox/path-utils.ts
/**
* POSIX container path helpers for sandbox paths.
*
* Container paths normalize independently from host platform paths.
*/
/** Normalizes a container path and treats "." as the container root. */
function normalizeContainerPath(value) {
	const normalized = node_path.default.posix.normalize(value);
	return normalized === "." ? "/" : normalized;
}
/** Returns whether target is lexically inside root after container-path normalization. */
function isPathInsideContainerRoot(root, target) {
	const normalizedRoot = normalizeContainerPath(root);
	const normalizedTarget = normalizeContainerPath(target);
	if (normalizedRoot === "/") return true;
	return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}/`);
}
/** Returns whether a relative path would escape its container root. */
function relativePathEscapesContainerRoot(relativePath) {
	return relativePath === ".." || relativePath.startsWith("../") || node_path.default.posix.isAbsolute(relativePath);
}
//#endregion
Object.defineProperty(exports, "isPathInsideContainerRoot", {
	enumerable: true,
	get: function() {
		return isPathInsideContainerRoot;
	}
});
Object.defineProperty(exports, "normalizeContainerPath", {
	enumerable: true,
	get: function() {
		return normalizeContainerPath;
	}
});
Object.defineProperty(exports, "relativePathEscapesContainerRoot", {
	enumerable: true,
	get: function() {
		return relativePathEscapesContainerRoot;
	}
});
