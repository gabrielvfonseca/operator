const require_parse_finite_number = require("./parse-finite-number-BTqU_Omp.cjs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
//#region src/infra/ports-netstat.ts
function normalizeTcpHost(host) {
	const normalized = host.toLowerCase();
	return normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
}
function parseTcpPort(raw) {
	if (!raw || !/^\d+$/.test(raw)) return null;
	const port = Number(raw);
	return Number.isSafeInteger(port) && port >= 0 && port <= 65535 ? port : null;
}
function parseTcpEndpoint(raw) {
	const endpoint = raw.trim();
	const bracketMatch = endpoint.match(/^\[([^\]]+)\]:(\d+)$/);
	if (bracketMatch) {
		const port = parseTcpPort(bracketMatch[2]);
		return port === null ? null : {
			host: normalizeTcpHost((0, _gabrielvfonseca_normalization_core.expectDefined)(bracketMatch[1], "bracket match capture group 1")),
			port
		};
	}
	const lastColon = endpoint.lastIndexOf(":");
	if (lastColon <= 0 || lastColon >= endpoint.length - 1) return null;
	const port = parseTcpPort(endpoint.slice(lastColon + 1));
	if (port === null) return null;
	return {
		host: normalizeTcpHost(endpoint.slice(0, lastColon)),
		port
	};
}
function isWildcardEndpoint(raw) {
	const endpoint = raw?.trim();
	if (!endpoint || endpoint === "*:*") return true;
	const parsed = parseTcpEndpoint(endpoint);
	if (!parsed) return false;
	return parsed.port === 0 && [
		"0.0.0.0",
		"::",
		"*"
	].includes(parsed.host);
}
function parseWindowsNetstatListeners(output, port) {
	const listeners = [];
	for (const rawLine of output.split(/\r?\n/)) {
		const parts = rawLine.trim().split(/\s+/);
		if (parts.length < 5 || parts[0]?.toUpperCase() !== "TCP") continue;
		const localAddress = parts[1];
		const remoteAddress = parts[2];
		if (!localAddress || parseTcpEndpoint(localAddress)?.port !== port) continue;
		if (!isWildcardEndpoint(remoteAddress)) continue;
		const pid = require_parse_finite_number.parseStrictPositiveInteger(parts.at(-1));
		if (pid === void 0) continue;
		listeners.push({
			pid,
			address: localAddress
		});
	}
	return listeners;
}
//#endregion
Object.defineProperty(exports, "parseTcpEndpoint", {
	enumerable: true,
	get: function() {
		return parseTcpEndpoint;
	}
});
Object.defineProperty(exports, "parseWindowsNetstatListeners", {
	enumerable: true,
	get: function() {
		return parseWindowsNetstatListeners;
	}
});
