const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec_safety = require("./exec-safety-BaXScHTe.cjs");
const require_home_dir = require("./home-dir-DDyi_SB-.cjs");
require("./utils-CXqBhRFw.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/infra/detect-binary.ts
/** Return true when a safe executable name/path can be found on this host. */
async function detectBinary(name) {
	if (!name?.trim()) return false;
	if (!require_exec_safety.isSafeExecutableValue(name)) return false;
	const resolved = name.startsWith("~") ? require_home_dir.resolveUserPath(name) : name;
	if (node_path.default.isAbsolute(resolved) || resolved.startsWith(".") || resolved.includes("/") || resolved.includes("\\")) try {
		await node_fs_promises.default.access(resolved);
		return true;
	} catch {
		return false;
	}
	const command = process.platform === "win32" ? [require_windows_install_roots.getWindowsSystem32ExePath("where.exe"), name] : [
		"/usr/bin/env",
		"which",
		name
	];
	try {
		const result = await require_exec.runCommandWithTimeout(command, { timeoutMs: 2e3 });
		return result.code === 0 && result.stdout.trim().length > 0;
	} catch {
		return false;
	}
}
//#endregion
Object.defineProperty(exports, "detectBinary", {
	enumerable: true,
	get: function() {
		return detectBinary;
	}
});
