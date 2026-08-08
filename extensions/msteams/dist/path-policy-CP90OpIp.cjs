const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_sandbox_paths = require("./sandbox-paths-BmmHDLnB.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/agents/path-policy.ts
/**
* Shared workspace and sandbox path boundary helpers.
*
* Converts validated absolute or relative inputs into root-relative paths without allowing boundary escapes.
*/
function throwPathEscapesBoundary(params) {
	const boundary = params.options?.boundaryLabel ?? "workspace root";
	const suffix = params.options?.includeRootInError ? ` (${params.rootResolved})` : "";
	throw new Error(`Path escapes ${boundary}${suffix}: ${params.candidate}`);
}
function validateRelativePathWithinBoundary(params) {
	if (params.relativePath === "" || params.relativePath === ".") {
		if (params.options?.allowRoot) return "";
		throwPathEscapesBoundary({
			options: params.options,
			rootResolved: params.rootResolved,
			candidate: params.candidate
		});
	}
	if (params.relativePath === ".." || params.relativePath.startsWith("../") || params.relativePath.startsWith("..\\") || params.isAbsolutePath(params.relativePath)) throwPathEscapesBoundary({
		options: params.options,
		rootResolved: params.rootResolved,
		candidate: params.candidate
	});
	return params.relativePath;
}
function toRelativePathUnderRoot(params) {
	const resolvedInput = require_sandbox_paths.resolveSandboxInputPath(params.candidate, params.options?.cwd ?? params.root);
	if (process.platform === "win32") {
		const rootResolved = node_path.default.win32.resolve(params.root);
		const resolvedCandidate = node_path.default.win32.resolve(resolvedInput);
		const rootForCompare = (0, _openclaw_fs_safe_path.normalizeWindowsPathForComparison)(rootResolved);
		const targetForCompare = (0, _openclaw_fs_safe_path.normalizeWindowsPathForComparison)(resolvedCandidate);
		return validateRelativePathWithinBoundary({
			relativePath: node_path.default.win32.relative(rootForCompare, targetForCompare),
			isAbsolutePath: node_path.default.win32.isAbsolute,
			options: params.options,
			rootResolved,
			candidate: params.candidate
		});
	}
	const rootResolved = node_path.default.resolve(params.root);
	const resolvedCandidate = node_path.default.resolve(resolvedInput);
	return validateRelativePathWithinBoundary({
		relativePath: node_path.default.relative(rootResolved, resolvedCandidate),
		isAbsolutePath: node_path.default.isAbsolute,
		options: params.options,
		rootResolved,
		candidate: params.candidate
	});
}
function toRelativeBoundaryPath(params) {
	return toRelativePathUnderRoot({
		root: params.root,
		candidate: params.candidate,
		options: {
			allowRoot: params.options?.allowRoot,
			cwd: params.options?.cwd,
			boundaryLabel: params.boundaryLabel,
			includeRootInError: params.includeRootInError
		}
	});
}
/**
* Return a workspace-relative path for a candidate path after rejecting paths
* that escape the workspace root.
*/
function toRelativeWorkspacePath(root, candidate, options) {
	return toRelativeBoundaryPath({
		root,
		candidate,
		options,
		boundaryLabel: "workspace root"
	});
}
/**
* Return a sandbox-relative path for a candidate path after rejecting paths that
* escape the sandbox root. Errors include the sandbox root for operator clarity.
*/
function toRelativeSandboxPath(root, candidate, options) {
	return toRelativeBoundaryPath({
		root,
		candidate,
		options,
		boundaryLabel: "sandbox root",
		includeRootInError: true
	});
}
/** Resolve a user-supplied path against `cwd` using the sandbox input rules. */
function resolvePathFromInput(filePath, cwd) {
	return node_path.default.normalize(require_sandbox_paths.resolveSandboxInputPath(filePath, cwd));
}
//#endregion
Object.defineProperty(exports, "resolvePathFromInput", {
	enumerable: true,
	get: function() {
		return resolvePathFromInput;
	}
});
Object.defineProperty(exports, "toRelativeSandboxPath", {
	enumerable: true,
	get: function() {
		return toRelativeSandboxPath;
	}
});
Object.defineProperty(exports, "toRelativeWorkspacePath", {
	enumerable: true,
	get: function() {
		return toRelativeWorkspacePath;
	}
});
