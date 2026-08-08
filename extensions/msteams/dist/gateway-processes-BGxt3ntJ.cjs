const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_windows_port_pids = require("./windows-port-pids-FzMQAPMX.cjs");
const require_restart_stale_pids = require("./restart-stale-pids-BPa4bniJ.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let node_child_process = require("node:child_process");
//#region src/infra/gateway-processes.ts
/** Read command argv for a PID using the current platform's process APIs. */
function readGatewayProcessArgsSync(pid) {
	if (process.platform === "linux") try {
		return require_windows_port_pids.parseProcCmdline(node_fs.default.readFileSync(`/proc/${pid}/cmdline`, "utf8"));
	} catch {
		return null;
	}
	if (process.platform === "darwin") {
		const ps = (0, node_child_process.spawnSync)("ps", [
			"-o",
			"command=",
			"-p",
			String(pid)
		], {
			encoding: "utf8",
			timeout: 1e3
		});
		if (ps.error || ps.status !== 0) return null;
		const command = ps.stdout.trim();
		return command ? command.split(/\s+/) : null;
	}
	if (process.platform === "win32") return require_windows_port_pids.readWindowsProcessArgsSync(pid);
	return null;
}
/** Signal a PID only after its argv matches a gateway process. */
function signalVerifiedGatewayPidSync(pid, signal) {
	const args = readGatewayProcessArgsSync(pid);
	if (!args || !require_windows_port_pids.isGatewayArgv(args, { allowGatewayBinary: true })) throw new Error(`refusing to signal non-gateway process pid ${pid}`);
	process.kill(pid, signal);
}
/** Find listener PIDs on `port` and keep only verified gateway processes. */
function findVerifiedGatewayListenerPidsOnPortSync(port) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.uniqueValues)(process.platform === "win32" ? require_windows_port_pids.readWindowsListeningPidsOnPortSync(port) : require_restart_stale_pids.findGatewayPidsOnPortSync(port)).filter((pid) => Number.isFinite(pid) && pid > 0 && pid !== process.pid).filter((pid) => {
		const args = readGatewayProcessArgsSync(pid);
		return args != null && require_windows_port_pids.isGatewayArgv(args, { allowGatewayBinary: true });
	});
}
/** Format gateway PIDs for human-facing diagnostics. */
function formatGatewayPidList(pids) {
	return pids.join(", ");
}
//#endregion
Object.defineProperty(exports, "findVerifiedGatewayListenerPidsOnPortSync", {
	enumerable: true,
	get: function() {
		return findVerifiedGatewayListenerPidsOnPortSync;
	}
});
Object.defineProperty(exports, "formatGatewayPidList", {
	enumerable: true,
	get: function() {
		return formatGatewayPidList;
	}
});
Object.defineProperty(exports, "readGatewayProcessArgsSync", {
	enumerable: true,
	get: function() {
		return readGatewayProcessArgsSync;
	}
});
Object.defineProperty(exports, "signalVerifiedGatewayPidSync", {
	enumerable: true,
	get: function() {
		return signalVerifiedGatewayPidSync;
	}
});
