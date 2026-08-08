const require_zod_parse = require("./zod-parse-D5uufcMS.cjs");
let zod = require("zod");
//#region src/shared/tailscale-status.ts
const TAILSCALE_STATUS_COMMAND_CANDIDATES = ["tailscale", "/Applications/Tailscale.app/Contents/MacOS/Tailscale"];
const TailscaleStatusSchema = zod.z.object({ Self: zod.z.object({
	DNSName: zod.z.string().optional(),
	TailscaleIPs: zod.z.array(zod.z.string()).optional()
}).optional() });
const TailscaleServeTcpHandlerSchema = zod.z.object({ HTTPS: zod.z.boolean().optional() });
const TailscaleServeWebServerSchema = zod.z.object({ Handlers: zod.z.record(zod.z.string(), zod.z.object({ Proxy: zod.z.string().optional() })) });
const TailscaleServeConfigSchema = zod.z.object({
	TCP: zod.z.record(zod.z.string(), TailscaleServeTcpHandlerSchema).optional(),
	Web: zod.z.record(zod.z.string(), TailscaleServeWebServerSchema).optional()
}).extend({ AllowFunnel: zod.z.record(zod.z.string(), zod.z.boolean()).optional() });
function parsePossiblyNoisyStatus(raw) {
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end <= start) return null;
	return require_zod_parse.safeParseJsonWithSchema(TailscaleStatusSchema, raw.slice(start, end + 1));
}
function extractTailnetHostFromStatusJson(raw) {
	const parsed = parsePossiblyNoisyStatus(raw);
	const dns = parsed?.Self?.DNSName;
	if (dns && dns.length > 0) return dns.replace(/\.$/, "");
	const ips = parsed?.Self?.TailscaleIPs ?? [];
	return ips.length > 0 ? ips[0] ?? null : null;
}
function parseLoopbackProxyPort(proxy) {
	const trimmed = proxy.trim();
	if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
	const normalized = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
	try {
		const parsed = new URL(normalized);
		const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
		if (!(host === "localhost" || host === "::1" || /^127(?:\.\d{1,3}){3}$/.test(host))) return null;
		const port = Number.parseInt(parsed.port, 10);
		return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
	} catch {
		return null;
	}
}
function collectServeGatewayUrls(config, gatewayPort, allowFunnel) {
	const urls = [];
	for (const [hostPort, webServer] of Object.entries(config.Web ?? {})) {
		const handler = webServer.Handlers["/"];
		if (allowFunnel[hostPort] || !handler?.Proxy || parseLoopbackProxyPort(handler.Proxy) !== gatewayPort) continue;
		try {
			const endpoint = new URL(`https://${hostPort}`);
			const port = endpoint.port || "443";
			if (config.TCP?.[port]?.HTTPS !== true) continue;
			urls.push(`wss://${endpoint.host}`);
		} catch {}
	}
	return urls;
}
function extractServeGatewayUrls(raw, gatewayPort) {
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end <= start) return [];
	const parsed = require_zod_parse.safeParseJsonWithSchema(TailscaleServeConfigSchema, raw.slice(start, end + 1));
	if (!parsed) return [];
	return [...new Set(collectServeGatewayUrls(parsed, gatewayPort, parsed.AllowFunnel ?? {}))].toSorted();
}
/** Resolves the host published to clients for tailnet or Tailscale Serve gateway modes. */
function resolveTailscalePublishedHost(params) {
	const tailnetHost = params.tailnetHost?.trim();
	if (!tailnetHost) return null;
	const serviceName = params.tailscaleMode === "serve" ? params.serviceName?.trim() || void 0 : void 0;
	if (!serviceName) return tailnetHost;
	if (/^[\d.:]+$/.test(tailnetHost)) return null;
	const bareServiceName = serviceName.replace(/^svc:/, "");
	const tailnetSuffix = tailnetHost.split(".").slice(1).join(".");
	return tailnetSuffix ? `${bareServiceName}.${tailnetSuffix}` : null;
}
/** Runs known Tailscale status commands and returns the first DNS name or tailnet IP found. */
async function resolveTailnetHostWithRunner(runCommandWithTimeout) {
	if (!runCommandWithTimeout) return null;
	for (const candidate of TAILSCALE_STATUS_COMMAND_CANDIDATES) try {
		const result = await runCommandWithTimeout([
			candidate,
			"status",
			"--json"
		], { timeoutMs: 5e3 });
		if (result.code !== 0) continue;
		const raw = result.stdout.trim();
		if (!raw) continue;
		const host = extractTailnetHostFromStatusJson(raw);
		if (host) return host;
	} catch {}
	return null;
}
/** Finds persistent HTTPS Serve routes whose root proxy targets this gateway port. */
async function resolveTailscaleServeGatewayUrlsWithRunner(gatewayPort, runCommandWithTimeout) {
	if (!runCommandWithTimeout) return [];
	for (const candidate of TAILSCALE_STATUS_COMMAND_CANDIDATES) try {
		const result = await runCommandWithTimeout([
			candidate,
			"serve",
			"status",
			"--json"
		], { timeoutMs: 5e3 });
		if (result.code !== 0 || !result.stdout.trim()) continue;
		const urls = extractServeGatewayUrls(result.stdout, gatewayPort);
		if (urls.length > 0) return urls;
	} catch {}
	return [];
}
//#endregion
Object.defineProperty(exports, "resolveTailnetHostWithRunner", {
	enumerable: true,
	get: function() {
		return resolveTailnetHostWithRunner;
	}
});
Object.defineProperty(exports, "resolveTailscalePublishedHost", {
	enumerable: true,
	get: function() {
		return resolveTailscalePublishedHost;
	}
});
Object.defineProperty(exports, "resolveTailscaleServeGatewayUrlsWithRunner", {
	enumerable: true,
	get: function() {
		return resolveTailscaleServeGatewayUrlsWithRunner;
	}
});
