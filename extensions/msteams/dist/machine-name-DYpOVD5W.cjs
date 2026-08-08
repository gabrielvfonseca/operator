const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_os = require("node:os");
node_os = require_rolldown_runtime.__toESM(node_os, 1);
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
//#region src/infra/machine-name.ts
var machine_name_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({ getMachineDisplayName: () => getMachineDisplayName });
let cachedPromise = null;
async function tryScutil(key) {
	try {
		const { stdout } = await require_exec.runExec("/usr/sbin/scutil", ["--get", key], {
			logOutput: false,
			timeoutMs: 1e3
		});
		const value = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(stdout) ?? "";
		return value.length > 0 ? value : null;
	} catch {
		return null;
	}
}
function fallbackHostName() {
	return ((0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(node_os.default.hostname()) ?? "").replace(/\.local$/i, "") || "@gabrielvfonseca/operator";
}
/** Resolve a user-facing name for the current machine. */
async function getMachineDisplayName() {
	if (cachedPromise) return cachedPromise;
	cachedPromise = (async () => {
		if (process.env.VITEST || false) return fallbackHostName();
		if (process.platform === "darwin") {
			const computerName = await tryScutil("ComputerName");
			if (computerName) return computerName;
			const localHostName = await tryScutil("LocalHostName");
			if (localHostName) return localHostName;
		}
		return fallbackHostName();
	})();
	return cachedPromise;
}
//#endregion
Object.defineProperty(exports, "getMachineDisplayName", {
	enumerable: true,
	get: function() {
		return getMachineDisplayName;
	}
});
Object.defineProperty(exports, "machine_name_exports", {
	enumerable: true,
	get: function() {
		return machine_name_exports;
	}
});
