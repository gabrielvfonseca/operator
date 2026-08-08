const require_globals = require("./globals-D7PiAd5y.cjs");
require("./errors-BqS4bzom.cjs");
const require_exec = require("./exec-CMb2J-j8.cjs");
let node_fs = require("node:fs");
let _gabrielvfonseca_normalization_core_number_coercion = require("@gabrielvfonseca/normalization-core/number-coercion");
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let _gabrielvfonseca_normalization_core_error_coercion = require("@gabrielvfonseca/normalization-core/error-coercion");
//#region src/infra/tailscale.ts
function parsePossiblyNoisyJsonObject(stdout) {
	const trimmed = stdout.trim();
	const start = trimmed.indexOf("{");
	const end = trimmed.lastIndexOf("}");
	if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
	return JSON.parse(trimmed);
}
/**
* Locate Tailscale binary using multiple strategies:
* 1. PATH lookup (via which command)
* 2. Known macOS app path
* 3. find /Applications for Tailscale.app
* 4. locate database (if available)
*
* @returns Path to Tailscale binary or null if not found
*/
async function findTailscaleBinary() {
	const checkBinary = async (path) => {
		if (!path || !(0, node_fs.existsSync)(path)) return false;
		try {
			await require_exec.runExec(path, ["--version"], { timeoutMs: 3e3 });
			return true;
		} catch {
			return false;
		}
	};
	try {
		const { stdout } = await require_exec.runExec("which", ["tailscale"]);
		const fromPath = stdout.trim();
		if (fromPath && await checkBinary(fromPath)) return fromPath;
	} catch {}
	const macAppPath = "/Applications/Tailscale.app/Contents/MacOS/Tailscale";
	if (await checkBinary(macAppPath)) return macAppPath;
	try {
		const { stdout } = await require_exec.runExec("find", [
			"/Applications",
			"-maxdepth",
			"3",
			"-name",
			"Tailscale",
			"-path",
			"*/Tailscale.app/Contents/MacOS/Tailscale"
		], { timeoutMs: 5e3 });
		const found = stdout.trim().split("\n")[0];
		if (found && await checkBinary(found)) return found;
	} catch {}
	try {
		const { stdout } = await require_exec.runExec("locate", ["Tailscale.app"]);
		const candidates = stdout.trim().split("\n").filter((line) => line.includes("/Tailscale.app/Contents/MacOS/Tailscale"));
		for (const candidate of candidates) if (await checkBinary(candidate)) return candidate;
	} catch {}
	return null;
}
async function getTailnetHostname(exec = require_exec.runExec, detectedBinary) {
	const candidates = detectedBinary ? [detectedBinary] : ["tailscale", "/Applications/Tailscale.app/Contents/MacOS/Tailscale"];
	let lastError;
	for (const candidate of candidates) {
		if (candidate.startsWith("/") && !(0, node_fs.existsSync)(candidate)) continue;
		try {
			const { stdout } = await exec(candidate, ["status", "--json"], {
				timeoutMs: 5e3,
				maxBuffer: 4e5
			});
			const parsed = stdout ? parsePossiblyNoisyJsonObject(stdout) : {};
			const self = typeof parsed.Self === "object" && parsed.Self !== null ? parsed.Self : void 0;
			const dns = typeof self?.DNSName === "string" ? self.DNSName : void 0;
			const ips = Array.isArray(self?.TailscaleIPs) ? parsed.Self.TailscaleIPs ?? [] : [];
			if (dns && dns.length > 0) return dns.replace(/\.$/, "");
			const [firstIp] = ips;
			if (firstIp !== void 0) return firstIp;
			throw new Error("Could not determine Tailscale DNS or IP");
		} catch (err) {
			lastError = err;
		}
	}
	throw (0, _gabrielvfonseca_normalization_core_error_coercion.toErrorObject)(lastError ?? /* @__PURE__ */ new Error("Could not determine Tailscale DNS or IP"), "Non-Error thrown");
}
/**
* Get the Tailscale binary command to use.
* Returns a cached detected binary or the default "tailscale" command.
*/
let cachedTailscaleBinary = null;
function getTestTailscaleBinaryOverride(env = process.env) {
	const forcedBinary = env.OPERATOR_TEST_TAILSCALE_BINARY?.trim();
	if (!forcedBinary) return null;
	if (env.VITEST || env.NODE_ENV === "test") return forcedBinary;
	return null;
}
async function getTailscaleBinary() {
	const forcedBinary = getTestTailscaleBinaryOverride();
	if (forcedBinary) {
		cachedTailscaleBinary = forcedBinary;
		return forcedBinary;
	}
	if (cachedTailscaleBinary) return cachedTailscaleBinary;
	cachedTailscaleBinary = await findTailscaleBinary();
	return cachedTailscaleBinary ?? "tailscale";
}
const whoisCache = /* @__PURE__ */ new Map();
function extractExecErrorText(err) {
	const errOutput = err;
	return {
		stdout: typeof errOutput.stdout === "string" ? errOutput.stdout : "",
		stderr: typeof errOutput.stderr === "string" ? errOutput.stderr : "",
		message: typeof errOutput.message === "string" ? errOutput.message : "",
		code: typeof errOutput.code === "string" ? errOutput.code : ""
	};
}
function isPermissionDeniedError(err) {
	const { stdout, stderr, message, code } = extractExecErrorText(err);
	if (code.toUpperCase() === "EACCES") return true;
	const combined = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(`${stdout}\n${stderr}\n${message}`);
	return combined.includes("permission denied") || combined.includes("access denied") || combined.includes("operation not permitted") || combined.includes("not permitted") || combined.includes("requires root") || combined.includes("must be run as root") || combined.includes("must be run with sudo") || combined.includes("requires sudo") || combined.includes("need sudo");
}
async function execWithSudoFallback(exec, bin, args, opts) {
	try {
		return await exec(bin, args, opts);
	} catch (err) {
		if (!isPermissionDeniedError(err)) throw err;
		require_globals.logVerbose(`Command failed, retrying with sudo: ${bin} ${args.join(" ")}`);
		try {
			return await exec("sudo", [
				"-n",
				bin,
				...args
			], opts);
		} catch (sudoErr) {
			const { stderr, message } = extractExecErrorText(sudoErr);
			const detail = (stderr || message).trim();
			if (detail) require_globals.logVerbose(`Sudo retry failed: ${detail}`);
			throw err;
		}
	}
}
async function enableTailscaleServe(port, exec = require_exec.runExec, serviceName) {
	await execWithSudoFallback(exec, await getTailscaleBinary(), [
		"serve",
		...serviceName ? [`--service=${serviceName}`] : [],
		"--bg",
		"--yes",
		`${port}`
	], {
		maxBuffer: 2e5,
		timeoutMs: 15e3
	});
}
async function hasTailscaleFunnelRouteForPort(port, exec = require_exec.runExec) {
	let stdout;
	try {
		stdout = (await exec(await getTailscaleBinary(), [
			"funnel",
			"status",
			"--json"
		], {
			maxBuffer: 2e5,
			timeoutMs: 5e3
		})).stdout;
	} catch {
		return false;
	}
	return tailscaleFunnelStatusCoversPort(stdout ? parsePossiblyNoisyJsonObject(stdout) : {}, port);
}
const TAILSCALE_LOOPBACK_PROXY_HOSTS = /* @__PURE__ */ new Set([
	"127.0.0.1",
	"localhost",
	"[::1]",
	"::1"
]);
function tailscaleFunnelStatusCoversPort(status, port) {
	for (const proxy of funnelStatusBackendsForPort(status)) if (tailscaleProxyMatchesLoopbackPort(proxy, port)) return true;
	return false;
}
function tailscaleProxyMatchesLoopbackPort(proxy, port) {
	const stripped = proxy.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, "").replace(/\/.*$/, "");
	if (stripped === String(port)) return true;
	const sep = stripped.lastIndexOf(":");
	if (sep < 0) return false;
	const host = stripped.slice(0, sep);
	if (stripped.slice(sep + 1) !== String(port)) return false;
	return TAILSCALE_LOOPBACK_PROXY_HOSTS.has(host);
}
function funnelStatusBackendsForPort(status) {
	const backends = /* @__PURE__ */ new Set();
	const allowFunnel = status.AllowFunnel ?? {};
	const enabledHosts = new Set(Object.entries(allowFunnel).filter(([, value]) => value === true).map(([host]) => host));
	if (enabledHosts.size === 0) return backends;
	const web = status.Web;
	if (!web || typeof web !== "object") return backends;
	for (const [host, handlers] of Object.entries(web)) {
		if (!enabledHosts.has(host)) continue;
		if (!handlers || typeof handlers !== "object") continue;
		const handlerEntries = handlers.Handlers;
		if (!handlerEntries || typeof handlerEntries !== "object") continue;
		for (const handler of Object.values(handlerEntries)) {
			const proxy = handler?.Proxy;
			if (typeof proxy === "string" && proxy.length > 0) backends.add(proxy);
		}
	}
	return backends;
}
async function disableTailscaleServe(exec = require_exec.runExec, serviceName) {
	await execWithSudoFallback(exec, await getTailscaleBinary(), serviceName ? [
		"serve",
		"clear",
		serviceName
	] : ["serve", "reset"], {
		maxBuffer: 2e5,
		timeoutMs: 15e3
	});
}
async function enableTailscaleFunnel(port, exec = require_exec.runExec) {
	await execWithSudoFallback(exec, await getTailscaleBinary(), [
		"funnel",
		"--bg",
		"--yes",
		`${port}`
	], {
		maxBuffer: 2e5,
		timeoutMs: 15e3
	});
}
async function disableTailscaleFunnel(exec = require_exec.runExec) {
	await execWithSudoFallback(exec, await getTailscaleBinary(), ["funnel", "reset"], {
		maxBuffer: 2e5,
		timeoutMs: 15e3
	});
}
function parseWhoisIdentity(payload) {
	const userProfile = (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(payload.UserProfile) ?? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(payload.userProfile) ?? (0, _gabrielvfonseca_normalization_core_record_coerce.asNullableObjectRecord)(payload.User);
	const login = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.LoginName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.Login) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.login) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.LoginName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.login);
	if (!login) return null;
	return {
		login,
		name: (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.DisplayName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.Name) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(userProfile?.displayName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.DisplayName) ?? (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeOptionalString)(payload.name)
	};
}
function readCachedWhois(ip, now) {
	const validNow = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(now);
	if (validNow === void 0) return;
	const cached = whoisCache.get(ip);
	if (!cached) return;
	const expiresAt = (0, _gabrielvfonseca_normalization_core_number_coercion.asDateTimestampMs)(cached.expiresAt);
	if (expiresAt === void 0 || expiresAt <= validNow) {
		whoisCache.delete(ip);
		return;
	}
	return cached.value;
}
function writeCachedWhois(ip, value, ttlMs) {
	const expiresAt = (0, _gabrielvfonseca_normalization_core_number_coercion.resolveExpiresAtMsFromDurationMs)(ttlMs);
	if (expiresAt !== void 0) whoisCache.set(ip, {
		value,
		expiresAt
	});
}
async function readTailscaleWhoisIdentity(ip, exec = require_exec.runExec, opts) {
	const normalized = ip.trim();
	if (!normalized) return null;
	const cached = readCachedWhois(normalized, Date.now());
	if (cached !== void 0) return cached;
	const cacheTtlMs = opts?.cacheTtlMs ?? 6e4;
	const errorTtlMs = opts?.errorTtlMs ?? 5e3;
	try {
		const result = await exec(await getTailscaleBinary(), [
			"whois",
			"--json",
			normalized
		], {
			timeoutMs: opts?.timeoutMs ?? 5e3,
			maxBuffer: 2e5
		});
		const identity = parseWhoisIdentity(result.stdout ? parsePossiblyNoisyJsonObject(result.stdout) : {});
		writeCachedWhois(normalized, identity, cacheTtlMs);
		return identity;
	} catch {
		writeCachedWhois(normalized, null, errorTtlMs);
		return null;
	}
}
//#endregion
Object.defineProperty(exports, "disableTailscaleFunnel", {
	enumerable: true,
	get: function() {
		return disableTailscaleFunnel;
	}
});
Object.defineProperty(exports, "disableTailscaleServe", {
	enumerable: true,
	get: function() {
		return disableTailscaleServe;
	}
});
Object.defineProperty(exports, "enableTailscaleFunnel", {
	enumerable: true,
	get: function() {
		return enableTailscaleFunnel;
	}
});
Object.defineProperty(exports, "enableTailscaleServe", {
	enumerable: true,
	get: function() {
		return enableTailscaleServe;
	}
});
Object.defineProperty(exports, "findTailscaleBinary", {
	enumerable: true,
	get: function() {
		return findTailscaleBinary;
	}
});
Object.defineProperty(exports, "getTailnetHostname", {
	enumerable: true,
	get: function() {
		return getTailnetHostname;
	}
});
Object.defineProperty(exports, "hasTailscaleFunnelRouteForPort", {
	enumerable: true,
	get: function() {
		return hasTailscaleFunnelRouteForPort;
	}
});
Object.defineProperty(exports, "readTailscaleWhoisIdentity", {
	enumerable: true,
	get: function() {
		return readTailscaleWhoisIdentity;
	}
});
