const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
require("./path-safety-m1VY3jod.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/dev-source-root.ts
/** Env var that points bundled-plugin lookup at an Operator source checkout. */
const OPERATOR_DEV_SOURCE_ROOT_ENV = "OPERATOR_DEV_SOURCE_ROOT";
function readPackageName(packageJsonPath) {
	try {
		const parsed = JSON.parse(node_fs.default.readFileSync(packageJsonPath, "utf-8"));
		return typeof parsed.name === "string" ? parsed.name : null;
	} catch {
		return null;
	}
}
/** Resolves and validates the configured Operator development source root. */
function resolveOperatorDevSourceRoot(env = process.env) {
	const rawRoot = env[OPERATOR_DEV_SOURCE_ROOT_ENV]?.trim();
	if (!rawRoot) return null;
	const realRoot = (0, _openclaw_fs_safe_path.safeRealpathSync)(require_home_dir.resolveUserPath(rawRoot, env));
	if (!realRoot) return null;
	if (readPackageName(node_path.default.join(realRoot, "package.json")) !== "@gabrielvfonseca/operator") return null;
	if (!node_fs.default.existsSync(node_path.default.join(realRoot, "src"))) return null;
	if (!node_fs.default.existsSync(node_path.default.join(realRoot, "extensions"))) return null;
	return realRoot;
}
/** True when a bundled plugin root is inside the configured development source root. */
function isBundledPluginInsideDevSourceRoot(params) {
	const devSourceRoot = resolveOperatorDevSourceRoot(params.env);
	if (!devSourceRoot) return false;
	const extensionsRoot = (0, _openclaw_fs_safe_path.safeRealpathSync)(node_path.default.join(devSourceRoot, "extensions"));
	const pluginRoot = (0, _openclaw_fs_safe_path.safeRealpathSync)(require_home_dir.resolveUserPath(params.rootDir, params.env));
	if (!extensionsRoot || !pluginRoot) return false;
	return (0, _openclaw_fs_safe_path.isPathInside)(extensionsRoot, pluginRoot);
}
//#endregion
Object.defineProperty(exports, "isBundledPluginInsideDevSourceRoot", {
	enumerable: true,
	get: function() {
		return isBundledPluginInsideDevSourceRoot;
	}
});
Object.defineProperty(exports, "resolveOperatorDevSourceRoot", {
	enumerable: true,
	get: function() {
		return resolveOperatorDevSourceRoot;
	}
});
