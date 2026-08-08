const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
const require_windows_install_roots = require("./windows-install-roots-pUuZWNtA.cjs");
const require_arg_split = require("./arg-split-DENkSzVH.cjs");
const require_ports_netstat = require("./ports-netstat-CxiMwnNc.cjs");
let _gabrielvfonseca_normalization_core_string_normalization = require("@gabrielvfonseca/normalization-core/string-normalization");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_child_process = require("node:child_process");
//#region src/infra/gateway-process-argv.ts
function normalizeProcArg(arg) {
	return (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(arg.replaceAll("\\", "/"));
}
const ENTRY_CANDIDATES = [
	"dist/index.js",
	"dist/entry.js",
	"operator.mjs",
	"scripts/run-node.mjs",
	"src/entry.ts",
	"src/index.ts"
];
function parseProcCmdline(raw) {
	return (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(raw.split("\0"));
}
function isOperatorCommandArgv(args, command) {
	const normalized = args.map(normalizeProcArg);
	const exe = (normalized[0] ?? "").replace(/\.(bat|cmd|exe)$/i, "");
	if (!normalized.includes(normalizeProcArg(command))) return false;
	if (normalized.some((arg) => ENTRY_CANDIDATES.some((entry) => arg.endsWith(entry)))) return true;
	return exe.endsWith("/openclaw") || exe === "@gabrielvfonseca/operator";
}
function isGatewayArgv(args, opts) {
	const exe = (args.map(normalizeProcArg)[0] ?? "").replace(/\.(bat|cmd|exe)$/i, "");
	const isGatewayBinary = exe.endsWith("/operator-gateway") || exe === "operator-gateway";
	if (!isOperatorCommandArgv(args, "gateway")) return opts?.allowGatewayBinary === true && isGatewayBinary;
	return true;
}
//#endregion
//#region src/daemon/cmd-set.ts
/** Rejects line breaks before rendering values into Windows cmd scripts. */
function assertNoCmdLineBreak(value, field) {
	if (/[\r\n]/.test(value)) throw new Error(`${field} cannot contain CR or LF in Windows task scripts.`);
}
function escapeCmdSetAssignmentComponent(value) {
	return value.replace(/\^/g, "^^").replace(/%/g, "%%").replace(/!/g, "^!").replace(/"/g, "^\"");
}
function unescapeCmdSetAssignmentComponent(value) {
	let out = "";
	for (let i = 0; i < value.length; i += 1) {
		const ch = value[i];
		const next = value[i + 1];
		if (ch === "^" && (next === "^" || next === "\"" || next === "!")) {
			out += next;
			i += 1;
			continue;
		}
		if (ch === "%" && next === "%") {
			out += "%";
			i += 1;
			continue;
		}
		out += ch;
	}
	return out;
}
function parseCmdSetAssignment(line) {
	const raw = line.trim();
	if (!raw) return null;
	const quoted = raw.startsWith("\"") && raw.endsWith("\"") && raw.length >= 2;
	const assignment = quoted ? raw.slice(1, -1) : raw;
	const index = assignment.indexOf("=");
	if (index <= 0) return null;
	const key = assignment.slice(0, index).trim();
	const value = assignment.slice(index + 1).trim();
	if (!key) return null;
	if (!quoted) return {
		key,
		value
	};
	return {
		key: unescapeCmdSetAssignmentComponent(key),
		value: unescapeCmdSetAssignmentComponent(value)
	};
}
function renderCmdSetAssignment(key, value) {
	assertNoCmdLineBreak(key, "Environment variable name");
	assertNoCmdLineBreak(value, "Environment variable value");
	return `set "${escapeCmdSetAssignmentComponent(key)}=${escapeCmdSetAssignmentComponent(value)}"`;
}
//#endregion
//#region src/daemon/cmd-argv.ts
/** Windows cmd argument quoting and parser mirror used by service tests. */
function quoteCmdScriptArg(value) {
	assertNoCmdLineBreak(value, "Command argument");
	if (!value) return "\"\"";
	const escaped = value.replace(/"/g, "\\\"").replace(/%/g, "%%").replace(/!/g, "^!");
	if (!/[ \t"&|<>^()%!]/g.test(value)) return escaped;
	return `"${escaped}"`;
}
function unescapeCmdScriptArg(value) {
	return value.replace(/\^!/g, "!").replace(/%%/g, "%");
}
function parseCmdScriptCommandLine(value) {
	return require_arg_split.splitArgsPreservingQuotes(value, { escapeMode: "backslash-quote-only" }).map(unescapeCmdScriptArg);
}
//#endregion
//#region src/infra/windows-port-pids.ts
const DEFAULT_TIMEOUT_MS = 5e3;
function readListeningPidsViaPowerShell(port, timeoutMs) {
	const ps = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsPowerShellExePath(), [
		"-NoProfile",
		"-Command",
		`(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess)`
	], {
		encoding: "utf8",
		timeout: timeoutMs,
		windowsHide: true
	});
	if (ps.error || ps.status !== 0) return null;
	return ps.stdout.split(/\r?\n/).flatMap((line) => require_parse_finite_number.parseStrictPositiveInteger(line.trim()) ?? []);
}
function parseListeningPidsFromNetstat(stdout, port) {
	return [...new Set(require_ports_netstat.parseWindowsNetstatListeners(stdout, port).map((listener) => listener.pid))];
}
function readWindowsListeningPidsOnPortSync(port, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const result = readWindowsListeningPidsResultSync(port, timeoutMs);
	return result.ok ? result.pids : [];
}
function readWindowsListeningPidsResultSync(port, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const powershellPids = readListeningPidsViaPowerShell(port, timeoutMs);
	if (powershellPids != null) return {
		ok: true,
		pids: powershellPids
	};
	const netstat = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsSystem32ExePath("netstat.exe"), ["-ano"], {
		encoding: "utf8",
		timeout: timeoutMs,
		windowsHide: true
	});
	if (netstat.error) {
		const code = netstat.error.code;
		return {
			ok: false,
			permanent: code === "ENOENT" || code === "EACCES" || code === "EPERM"
		};
	}
	if (netstat.status !== 0) return {
		ok: false,
		permanent: false
	};
	return {
		ok: true,
		pids: parseListeningPidsFromNetstat(netstat.stdout, port)
	};
}
function decodeWindowsProcessOutput(output) {
	if (!Buffer.isBuffer(output)) return output;
	return output.length >= 2 && output[0] === 255 && output[1] === 254 ? output.toString("utf16le") : output.toString("utf8");
}
function extractWindowsCommandLine(raw) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(decodeWindowsProcessOutput(raw).split(/\r?\n/));
	for (const line of lines) {
		if (!(0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line).startsWith("commandline=")) continue;
		return line.slice(12).trim() || null;
	}
	return lines.find((line) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line) !== "commandline") ?? null;
}
function parseWindowsProcessStartTime(raw) {
	const lines = (0, _gabrielvfonseca_normalization_core_string_normalization.normalizeStringEntries)(decodeWindowsProcessOutput(raw).split(/\r?\n/));
	const value = lines.find((line) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line).startsWith("creationdate="))?.slice(13).trim() ?? lines.find((line) => (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(line) !== "creationdate") ?? "";
	const parsedIso = Date.parse(value);
	if (Number.isFinite(parsedIso)) return parsedIso;
	const dmtf = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d{6})([+-])(\d{3})$/);
	if (!dmtf) return null;
	const [, year, month, day, hour, minute, second, microseconds, offsetSign, offset] = dmtf;
	return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Math.floor(Number(microseconds) / 1e3)) - Number(offset) * 6e4 * (offsetSign === "+" ? 1 : -1);
}
/** Read a stable Windows process creation time for lock-owner identity checks. */
function readWindowsProcessStartTimeSync(pid, timeoutMs = DEFAULT_TIMEOUT_MS) {
	if (!Number.isInteger(pid) || pid <= 0) return null;
	const powershell = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsPowerShellExePath(), [
		"-NoProfile",
		"-NonInteractive",
		"-Command",
		`$process = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" -ErrorAction Stop; [Console]::Out.Write($process.CreationDate.ToUniversalTime().ToString("o"))`
	], {
		encoding: "utf8",
		timeout: timeoutMs,
		windowsHide: true
	});
	if (!powershell.error && powershell.status === 0) {
		const startTime = parseWindowsProcessStartTime(powershell.stdout);
		if (startTime !== null) return startTime;
	}
	const wmic = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsWmicExePath(), [
		"process",
		"where",
		`ProcessId=${pid}`,
		"get",
		"CreationDate",
		"/value"
	], {
		timeout: timeoutMs,
		windowsHide: true,
		stdio: [
			"ignore",
			"pipe",
			"ignore"
		]
	});
	return !wmic.error && wmic.status === 0 ? parseWindowsProcessStartTime(wmic.stdout) : null;
}
function readWindowsProcessArgsSync(pid, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const result = readWindowsProcessArgsResultSync(pid, timeoutMs);
	return result.ok ? result.args : null;
}
function readWindowsProcessArgsResultSync(pid, timeoutMs = DEFAULT_TIMEOUT_MS) {
	const powershell = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsPowerShellExePath(), [
		"-NoProfile",
		"-Command",
		`(Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object -ExpandProperty CommandLine)`
	], {
		encoding: "utf8",
		timeout: timeoutMs,
		windowsHide: true
	});
	if (!powershell.error && powershell.status === 0) {
		const command = powershell.stdout.trim();
		return {
			ok: true,
			args: command ? parseCmdScriptCommandLine(command) : null
		};
	}
	const wmic = (0, node_child_process.spawnSync)(require_windows_install_roots.getWindowsWmicExePath(), [
		"process",
		"where",
		`ProcessId=${pid}`,
		"get",
		"CommandLine",
		"/value"
	], {
		timeout: timeoutMs,
		windowsHide: true,
		stdio: [
			"ignore",
			"pipe",
			"ignore"
		]
	});
	if (!wmic.error && wmic.status === 0) {
		const command = extractWindowsCommandLine(wmic.stdout);
		return {
			ok: true,
			args: command ? parseCmdScriptCommandLine(command) : null
		};
	}
	const code = (wmic.error ?? powershell.error)?.code;
	return {
		ok: false,
		permanent: code === "ENOENT" || code === "EACCES" || code === "EPERM"
	};
}
//#endregion
Object.defineProperty(exports, "assertNoCmdLineBreak", {
	enumerable: true,
	get: function() {
		return assertNoCmdLineBreak;
	}
});
Object.defineProperty(exports, "isGatewayArgv", {
	enumerable: true,
	get: function() {
		return isGatewayArgv;
	}
});
Object.defineProperty(exports, "isOperatorCommandArgv", {
	enumerable: true,
	get: function() {
		return isOperatorCommandArgv;
	}
});
Object.defineProperty(exports, "parseCmdScriptCommandLine", {
	enumerable: true,
	get: function() {
		return parseCmdScriptCommandLine;
	}
});
Object.defineProperty(exports, "parseCmdSetAssignment", {
	enumerable: true,
	get: function() {
		return parseCmdSetAssignment;
	}
});
Object.defineProperty(exports, "parseProcCmdline", {
	enumerable: true,
	get: function() {
		return parseProcCmdline;
	}
});
Object.defineProperty(exports, "quoteCmdScriptArg", {
	enumerable: true,
	get: function() {
		return quoteCmdScriptArg;
	}
});
Object.defineProperty(exports, "readWindowsListeningPidsOnPortSync", {
	enumerable: true,
	get: function() {
		return readWindowsListeningPidsOnPortSync;
	}
});
Object.defineProperty(exports, "readWindowsListeningPidsResultSync", {
	enumerable: true,
	get: function() {
		return readWindowsListeningPidsResultSync;
	}
});
Object.defineProperty(exports, "readWindowsProcessArgsResultSync", {
	enumerable: true,
	get: function() {
		return readWindowsProcessArgsResultSync;
	}
});
Object.defineProperty(exports, "readWindowsProcessArgsSync", {
	enumerable: true,
	get: function() {
		return readWindowsProcessArgsSync;
	}
});
Object.defineProperty(exports, "readWindowsProcessStartTimeSync", {
	enumerable: true,
	get: function() {
		return readWindowsProcessStartTimeSync;
	}
});
Object.defineProperty(exports, "renderCmdSetAssignment", {
	enumerable: true,
	get: function() {
		return renderCmdSetAssignment;
	}
});
