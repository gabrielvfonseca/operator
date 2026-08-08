const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./path-safety-m1VY3jod.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _openclaw_fs_safe_path = require("@openclaw/fs-safe/path");
//#region src/plugins/hardlink-policy.ts
/** Enforces plugin root hardlink policy with bundled and immutable Nix-store exceptions. */
const NIX_STORE_ROOT = "/nix/store";
/** Returns true when a plugin root resolves inside the immutable Nix store. */
function isNixStorePluginRoot(rootDir, realpathCache) {
	const rootRealPath = (0, _openclaw_fs_safe_path.safeRealpathSync)(rootDir, realpathCache) ?? node_path.default.resolve(rootDir);
	return rootRealPath === NIX_STORE_ROOT || rootRealPath.startsWith(`${NIX_STORE_ROOT}/`);
}
/** Decides whether plugin file hardlinks should fail boundary validation for one root. */
function shouldRejectHardlinkedPluginFiles(params) {
	if (params.origin === "bundled") return false;
	if (require_paths.resolveIsNixMode(params.env) && isNixStorePluginRoot(params.rootDir, params.realpathCache)) return false;
	return true;
}
//#endregion
Object.defineProperty(exports, "shouldRejectHardlinkedPluginFiles", {
	enumerable: true,
	get: function() {
		return shouldRejectHardlinkedPluginFiles;
	}
});
