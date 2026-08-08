const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
const require_utils = require("./utils-CXqBhRFw.cjs");
const require_bundled_dir = require("./bundled-dir-OMER9nrW.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
//#region src/plugins/roots.ts
function resolvePluginSourceRoots(params) {
	const env = params.env ?? process.env;
	const workspaceRoot = params.workspaceDir ? require_home_dir.resolveUserPath(params.workspaceDir, env) : void 0;
	return {
		stock: require_bundled_dir.resolveBundledPluginsDir(env),
		global: node_path.default.join(require_utils.resolveConfigDir(env), "extensions"),
		workspace: workspaceRoot ? node_path.default.join(workspaceRoot, ".operator", "extensions") : void 0
	};
}
function resolvePluginCacheInputs(params) {
	const env = params.env ?? process.env;
	return {
		roots: resolvePluginSourceRoots({
			workspaceDir: params.workspaceDir,
			env
		}),
		loadPaths: (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)((params.loadPaths ?? []).filter((entry) => typeof entry === "string")).map((entry) => require_home_dir.resolveUserPath(entry, env))
	};
}
//#endregion
Object.defineProperty(exports, "resolvePluginCacheInputs", {
	enumerable: true,
	get: function() {
		return resolvePluginCacheInputs;
	}
});
Object.defineProperty(exports, "resolvePluginSourceRoots", {
	enumerable: true,
	get: function() {
		return resolvePluginSourceRoots;
	}
});
