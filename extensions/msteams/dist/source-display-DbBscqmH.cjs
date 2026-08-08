const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
require("./path-guards-CMMkJCy0.cjs");
const require_roots = require("./roots-5HJCnp4q.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/source-display.ts
/** Formats plugin source paths for user-facing status output. */
function tryRelative(root, filePath) {
	if (!(0, _openclaw_fs_safe_path.isPathInside)(root, filePath)) return null;
	const rel = node_path.default.relative(root, filePath);
	if (!rel || rel === ".") return null;
	return rel.replaceAll("\\", "/");
}
/** Formats a plugin source path for status tables using known source roots. */
function formatPluginSourceForTable(plugin, roots) {
	const raw = plugin.source;
	if (plugin.origin === "bundled" && roots.stock) {
		const rel = tryRelative(roots.stock, raw);
		if (rel) return {
			value: `stock:${rel}`,
			rootKey: "stock"
		};
	}
	if (plugin.origin === "workspace" && roots.workspace) {
		const rel = tryRelative(roots.workspace, raw);
		if (rel) return {
			value: `workspace:${rel}`,
			rootKey: "workspace"
		};
	}
	if (plugin.origin === "global" && roots.global) {
		const rel = tryRelative(roots.global, raw);
		if (rel) return {
			value: `global:${rel}`,
			rootKey: "global"
		};
	}
	return { value: require_utils.shortenHomeInString(raw) };
}
//#endregion
exports.formatPluginSourceForTable = formatPluginSourceForTable;
exports.resolvePluginSourceRoots = require_roots.resolvePluginSourceRoots;
