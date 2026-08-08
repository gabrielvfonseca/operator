const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_openclaw_root = require("./openclaw-root-CMdsun7e.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
//#region src/agents/docs-path.ts
/**
* Locates local Operator docs/source roots for references shown to agents.
*/
var docs_path_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	OPERATOR_DOCS_URL: () => OPERATOR_DOCS_URL,
	OPERATOR_SOURCE_URL: () => OPERATOR_SOURCE_URL,
	resolveOperatorReferencePaths: () => resolveOperatorReferencePaths
});
const OPERATOR_DOCS_URL = "https://docs.operator.ai";
const OPERATOR_SOURCE_URL = "https://github.com/openclaw/openclaw";
function isUsableDocsDir(docsDir) {
	return node_fs.default.existsSync(node_path.default.join(docsDir, "docs.json"));
}
function isGitCheckout(rootDir) {
	return node_fs.default.existsSync(node_path.default.join(rootDir, ".git"));
}
/** Resolve a usable local docs directory, preferring the active workspace. */
async function resolveOperatorDocsPath(params) {
	const workspaceDir = params.workspaceDir?.trim();
	if (workspaceDir) {
		const workspaceDocs = node_path.default.join(workspaceDir, "docs");
		if (isUsableDocsDir(workspaceDocs)) return workspaceDocs;
	}
	const packageRoot = await require_openclaw_root.resolveOperatorPackageRoot({
		cwd: params.cwd,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl
	});
	if (!packageRoot) return null;
	const packageDocs = node_path.default.join(packageRoot, "docs");
	return isUsableDocsDir(packageDocs) ? packageDocs : null;
}
/** Resolve the package root only when it is a Git checkout. */
async function resolveOperatorSourcePath(params) {
	const packageRoot = await require_openclaw_root.resolveOperatorPackageRoot({
		cwd: params.cwd,
		argv1: params.argv1,
		moduleUrl: params.moduleUrl
	});
	if (!packageRoot || !isGitCheckout(packageRoot)) return null;
	return packageRoot;
}
/** Resolve docs and source roots concurrently for prompt/reference injection. */
async function resolveOperatorReferencePaths(params) {
	const [docsPath, sourcePath] = await Promise.all([resolveOperatorDocsPath(params), resolveOperatorSourcePath(params)]);
	return {
		docsPath,
		sourcePath
	};
}
//#endregion
Object.defineProperty(exports, "OPERATOR_DOCS_URL", {
	enumerable: true,
	get: function() {
		return OPERATOR_DOCS_URL;
	}
});
Object.defineProperty(exports, "OPERATOR_SOURCE_URL", {
	enumerable: true,
	get: function() {
		return OPERATOR_SOURCE_URL;
	}
});
Object.defineProperty(exports, "docs_path_exports", {
	enumerable: true,
	get: function() {
		return docs_path_exports;
	}
});
Object.defineProperty(exports, "resolveOperatorReferencePaths", {
	enumerable: true,
	get: function() {
		return resolveOperatorReferencePaths;
	}
});
