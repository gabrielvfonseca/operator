const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/infra/stable-node-path.ts
/**
* Homebrew Cellar paths (e.g. /opt/homebrew/Cellar/node/25.7.0/bin/node)
* break when Homebrew upgrades Node and removes the old version directory.
* Resolve these to a stable Homebrew-managed path that survives upgrades:
*   - Default formula "node":  <prefix>/opt/node/bin/node  or  <prefix>/bin/node
*   - Versioned formula "node@22":  <prefix>/opt/node@22/bin/node  (keg-only)
*/
async function resolveStableNodePath(nodePath) {
	const cellarMatch = nodePath.match(/^(.+?)[\\/]Cellar[\\/]([^\\/]+)[\\/][^\\/]+[\\/]bin[\\/]node$/);
	if (!cellarMatch) return nodePath;
	const prefix = (0, _gabrielvfonseca_normalization_core.expectDefined)(cellarMatch[1], "cellar match capture group 1");
	const formula = (0, _gabrielvfonseca_normalization_core.expectDefined)(cellarMatch[2], "cellar match capture group 2");
	const pathModule = nodePath.includes("\\") ? node_path.default.win32 : node_path.default.posix;
	const optPath = pathModule.join(prefix, "opt", formula, "bin", "node");
	try {
		await node_fs_promises.default.access(optPath);
		return optPath;
	} catch {}
	if (formula === "node") {
		const binPath = pathModule.join(prefix, "bin", "node");
		try {
			await node_fs_promises.default.access(binPath);
			return binPath;
		} catch {}
	}
	return nodePath;
}
//#endregion
Object.defineProperty(exports, "resolveStableNodePath", {
	enumerable: true,
	get: function() {
		return resolveStableNodePath;
	}
});
