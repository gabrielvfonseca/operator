const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
require("./string-readers-DjRuUveR.cjs");
const require_active_proxy_state = require("./active-proxy-state-IFfwIaiY.cjs");
let node_fs = require("node:fs");
let _gabrielvfonseca_normalization_core = require("@gabrielvfonseca/normalization-core");
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_normalization_core_string_coerce = require("@gabrielvfonseca/normalization-core/string-coerce");
let node_module = require("node:module");
let node_net = require("node:net");
node_net = require_rolldown_runtime.__toESM(node_net, 1);
let _openclaw_proxyline_dispatcher_brand = require("@openclaw/proxyline/dispatcher-brand");
//#region src/infra/net/proxy-env.ts
function normalizeProxyEnvValue(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
/**
* Match undici EnvHttpProxyAgent semantics for env-based HTTP/S proxy selection:
* - lower-case vars take precedence over upper-case
* - HTTPS requests prefer https_proxy/HTTPS_PROXY, then fall back to http_proxy/HTTP_PROXY
* - ALL_PROXY is ignored by EnvHttpProxyAgent
*/
function resolveEnvHttpProxyUrl(protocol, env = process.env) {
	const lowerHttpProxy = normalizeProxyEnvValue(env.http_proxy);
	const lowerHttpsProxy = normalizeProxyEnvValue(env.https_proxy);
	const httpProxy = lowerHttpProxy !== void 0 ? lowerHttpProxy : normalizeProxyEnvValue(env.HTTP_PROXY);
	const httpsProxy = lowerHttpsProxy !== void 0 ? lowerHttpsProxy : normalizeProxyEnvValue(env.HTTPS_PROXY);
	if (protocol === "https") return httpsProxy ?? httpProxy ?? void 0;
	return httpProxy ?? void 0;
}
/** Return whether EnvHttpProxyAgent-style HTTP/S proxy resolution finds a proxy URL. */
function hasEnvHttpProxyConfigured(protocol = "https", env = process.env) {
	return resolveEnvHttpProxyUrl(protocol, env) !== void 0;
}
function resolveEnvAllProxyUrl(env) {
	const lowerAllProxy = normalizeProxyEnvValue(env.all_proxy);
	return (lowerAllProxy !== void 0 ? lowerAllProxy : normalizeProxyEnvValue(env.ALL_PROXY)) ?? void 0;
}
/**
* Build explicit options for undici's EnvHttpProxyAgent.
*
* EnvHttpProxyAgent does not read ALL_PROXY itself, but it accepts explicit
* HTTP/HTTPS proxy overrides. Keep this helper separate from the
* HTTP(S)-only URL helpers so SSRF trusted-env proxy gates do not widen.
*/
function resolveEnvHttpProxyAgentOptions(env = process.env) {
	const allProxy = resolveEnvAllProxyUrl(env);
	const httpProxy = resolveEnvHttpProxyUrl("http", env) ?? allProxy;
	const httpsProxy = resolveEnvHttpProxyUrl("https", env) ?? httpProxy;
	const options = {
		...httpProxy ? { httpProxy } : {},
		...httpsProxy ? { httpsProxy } : {}
	};
	return options.httpProxy || options.httpsProxy ? options : void 0;
}
/** Return whether explicit EnvHttpProxyAgent options can be built from the environment. */
function hasEnvHttpProxyAgentConfigured(env = process.env) {
	return resolveEnvHttpProxyAgentOptions(env) !== void 0;
}
/** Return whether a target URL should use configured HTTP/S env proxy variables. */
function shouldUseEnvHttpProxyForUrl(targetUrl, env = process.env) {
	let protocol;
	try {
		const parsed = new URL(targetUrl);
		if (parsed.protocol === "http:") protocol = "http";
		else if (parsed.protocol === "https:") protocol = "https";
		else return false;
	} catch {
		return false;
	}
	return hasEnvHttpProxyConfigured(protocol, env) && !matchesNoProxy(targetUrl, env);
}
/**
* Check whether a target URL should bypass the HTTP proxy per NO_PROXY env var.
*
* Mirrors undici EnvHttpProxyAgent semantics
* (`undici/lib/dispatcher/env-http-proxy-agent.js`):
* - Entries separated by commas OR whitespace (undici splits on `/[,\s]/`)
* - Case-insensitive
* - Lower-case `no_proxy` shadows upper-case `NO_PROXY`, including blank values
* - Empty or missing → no bypass
* - Bare `*` value → bypass everything
* - Exact hostname match
* - Leading-dot match (`.example.com` matches `foo.example.com`)
* - Leading `*.` wildcard match (`*.example.com` matches `foo.example.com`);
*   undici normalizes via `.replace(/^\*?\./, '')`, so the bare domain also
*   matches (kept in sync with that behavior)
* - Subdomain suffix match (`openai.com` matches `api.openai.com`)
* - Optional `:port` suffix; when present, must match target port
* - IPv6 literals in bracketed (`[::1]`) or bare (`::1`) form
* - Operator extension: IPv4 CIDR and octet-wildcard entries
*   (`100.64.0.0/10`, `100.64.*`) bypass the trusted env proxy mode before
*   undici's EnvHttpProxyAgent is selected.
*
* Undici does not export its matcher, so this is a targeted reimplementation
* kept in sync with the upstream file above. Paired with
* `hasEnvHttpProxyConfigured` this gates the trusted-env-proxy auto-upgrade
* in provider HTTP helpers; see openclaw#64974 review thread on NO_PROXY
* SSRF bypass.
*/
function matchesNoProxy(targetUrl, env = process.env) {
	const raw = env.no_proxy ?? env.NO_PROXY ?? "";
	if (!raw) return false;
	let parsed;
	try {
		parsed = new URL(targetUrl);
	} catch {
		return false;
	}
	const targetHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
	if (!targetHost) return false;
	if (raw === "*") return true;
	const targetPort = parsed.port !== "" ? parsed.port : parsed.protocol === "https:" ? "443" : parsed.protocol === "http:" ? "80" : "";
	for (const rawEntry of raw.split(/[,\s]/)) {
		const entry = rawEntry.trim().toLowerCase();
		if (!entry) continue;
		let entryHost;
		let entryPort;
		if (entry.startsWith("[")) {
			const m = entry.match(/^\[([^\]]+)\](?::(\d+))?$/);
			if (!m) continue;
			entryHost = (0, _gabrielvfonseca_normalization_core.expectDefined)(m[1], "m capture group 1");
			entryPort = m[2];
		} else {
			const firstColonIdx = entry.indexOf(":");
			const lastColonIdx = entry.lastIndexOf(":");
			if (firstColonIdx > -1 && firstColonIdx === lastColonIdx && /^\d+$/.test(entry.slice(lastColonIdx + 1))) {
				entryHost = entry.slice(0, lastColonIdx);
				entryPort = entry.slice(lastColonIdx + 1);
			} else entryHost = entry;
		}
		if (entryPort && entryPort !== targetPort) continue;
		const normalizedEntry = entryHost.replace(/^\*\./, "").replace(/^\./, "");
		if (!normalizedEntry || normalizedEntry === "*") continue;
		if (matchesIpv4NoProxyPattern(targetHost, normalizedEntry)) return true;
		if (targetHost === normalizedEntry) return true;
		if (targetHost.endsWith(`.${normalizedEntry}`)) return true;
	}
	return false;
}
function parseIpv4Address(host) {
	const parts = host.split(".");
	if (parts.length !== 4) return;
	let value = 0;
	for (const part of parts) {
		if (!/^\d{1,3}$/.test(part)) return;
		const octet = Number(part);
		if (!Number.isInteger(octet) || octet < 0 || octet > 255) return;
		value = value << 8 | octet;
	}
	return value >>> 0;
}
function matchesIpv4NoProxyPattern(targetHost, entryHost) {
	const target = parseIpv4Address(targetHost);
	if (target === void 0) return false;
	const cidrMatch = entryHost.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
	if (cidrMatch) {
		const network = parseIpv4Address((0, _gabrielvfonseca_normalization_core.expectDefined)(cidrMatch[1], "cidr match capture group 1"));
		const prefixLength = Number(cidrMatch[2]);
		if (network === void 0 || prefixLength < 0 || prefixLength > 32) return false;
		const mask = prefixLength === 0 ? 0 : 4294967295 << 32 - prefixLength >>> 0;
		return (target & mask) === (network & mask);
	}
	if (!entryHost.includes("*")) return false;
	const targetParts = targetHost.split(".");
	const patternParts = entryHost.split(".");
	if (patternParts.length > 4 || patternParts.length === 0) return false;
	for (const [index, part] of patternParts.entries()) {
		if (part === "*") {
			if (index === patternParts.length - 1) return true;
			continue;
		}
		if (!/^\d{1,3}$/.test(part) || Number(part) !== Number(targetParts[index])) return false;
	}
	return patternParts.length === targetParts.length;
}
//#endregion
//#region src/infra/net/proxy/proxy-tls.ts
function normalizeOptionalPath(value) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : void 0;
}
function formatReadError(err) {
	return err instanceof Error ? err.message : String(err);
}
function isHttpsProxyUrl(value) {
	if (!value) return false;
	try {
		return new URL(value).protocol === "https:";
	} catch {
		return false;
	}
}
/** Resolves the configured managed proxy CA file, with env/CLI override first. */
function resolveManagedProxyCaFile(params) {
	return normalizeOptionalPath(params.caFileOverride) ?? normalizeOptionalPath(params.config?.tls?.caFile);
}
/** Returns a CA file only for HTTPS proxy URLs; HTTP proxies do not need TLS trust. */
function resolveManagedProxyCaFileForUrl(params) {
	if (!isHttpsProxyUrl(params.proxyUrl)) return;
	return resolveManagedProxyCaFile({
		config: params.config,
		caFileOverride: params.caFileOverride
	});
}
/** Loads managed proxy TLS options synchronously for inherited child-process routing. */
function loadManagedProxyTlsOptionsSync(caFile) {
	if (!caFile) return;
	try {
		return { ca: (0, node_fs.readFileSync)(caFile, "utf8") };
	} catch (err) {
		throw new Error(`proxy CA file could not be read (${caFile}): ${formatReadError(err)}`, { cause: err });
	}
}
//#endregion
//#region src/infra/net/proxy/active-managed-proxy-tls.ts
const MANAGED_PROXY_ENV_PREFIX = ["OPERATOR", "PROXY"].join("_");
const MANAGED_PROXY_ACTIVE_ENV_KEY = `${MANAGED_PROXY_ENV_PREFIX}_ACTIVE`;
const MANAGED_PROXY_CA_FILE_ENV_KEY = `${MANAGED_PROXY_ENV_PREFIX}_CA_FILE`;
function normalizeProxyUrl(value) {
	if (!value) return;
	try {
		return new URL(value).href;
	} catch {
		return;
	}
}
function resolveManagedProxyUrl(env = process.env) {
	const activeProxyUrl = require_active_proxy_state.getActiveManagedProxyUrl();
	if (activeProxyUrl) return activeProxyUrl.href;
	if (env[MANAGED_PROXY_ACTIVE_ENV_KEY] !== "1") return;
	return normalizeProxyUrl(resolveEnvHttpProxyUrl("https", env));
}
/** Resolves managed proxy TLS trust only when the target proxy is Operator's active proxy. */
function resolveActiveManagedProxyTlsOptions(params) {
	const env = params?.env ?? process.env;
	const managedProxyUrl = resolveManagedProxyUrl(env);
	const targetProxyUrl = normalizeProxyUrl(params?.proxyUrl ?? resolveEnvHttpProxyUrl("https", env));
	if (!managedProxyUrl || targetProxyUrl !== managedProxyUrl) return;
	const activeProxyTls = require_active_proxy_state.getActiveManagedProxyTlsOptions();
	if (activeProxyTls) return activeProxyTls;
	const proxyCaFile = resolveManagedProxyCaFileForUrl({
		proxyUrl: managedProxyUrl,
		caFileOverride: env[MANAGED_PROXY_CA_FILE_ENV_KEY]
	});
	try {
		return loadManagedProxyTlsOptionsSync(proxyCaFile);
	} catch {
		return;
	}
}
//#endregion
//#region src/infra/net/proxy/managed-proxy-undici.ts
function readProxyTlsRecord(options) {
	if (!options || !("proxyTls" in options)) return;
	return (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(options.proxyTls) ? options.proxyTls : void 0;
}
function readProxyUrlFromOptions(options) {
	if (!options) return;
	if ("uri" in options) {
		const uri = Reflect.get(options, "uri");
		return uri instanceof URL ? uri.href : typeof uri === "string" ? uri : void 0;
	}
	if ("httpsProxy" in options || "httpProxy" in options) {
		const httpsProxy = Reflect.get(options, "httpsProxy");
		const httpProxy = Reflect.get(options, "httpProxy");
		return typeof httpsProxy === "string" ? httpsProxy : typeof httpProxy === "string" ? httpProxy : void 0;
	}
}
function addActiveManagedProxyTlsOptions(options, params) {
	const proxyTls = resolveActiveManagedProxyTlsOptions({
		proxyUrl: readProxyUrlFromOptions(options),
		env: params?.env
	});
	if (!proxyTls) return options;
	const existingProxyTls = readProxyTlsRecord(options);
	return {
		...options,
		proxyTls: {
			...proxyTls,
			...existingProxyTls
		}
	};
}
/** Resolves env proxy options with managed proxy TLS attached when applicable. */
function resolveManagedEnvHttpProxyAgentOptions(env = process.env) {
	return addActiveManagedProxyTlsOptions(resolveEnvHttpProxyAgentOptions(env), { env });
}
//#endregion
//#region src/infra/wsl.ts
let wslCached = null;
/** Detects WSL from environment variables without touching the filesystem. */
function isWSLEnv(env = process.env) {
	if (env.WSL_INTEROP || env.WSL_DISTRO_NAME || env.WSLENV) return true;
	return false;
}
/**
* Synchronously detects WSL from env vars first, then `/proc/version`.
*/
function isWSLSync() {
	if (process.platform !== "linux") return false;
	if (isWSLEnv()) return true;
	try {
		const release = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, node_fs.readFileSync)("/proc/version", "utf8"));
		return release.includes("microsoft") || release.includes("wsl");
	} catch {
		return false;
	}
}
/**
* Synchronously detects WSL2 from kernel-version markers after WSL detection.
*/
function isWSL2Sync() {
	if (!isWSLSync()) return false;
	try {
		const version = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)((0, node_fs.readFileSync)("/proc/version", "utf8"));
		return version.includes("wsl2") || version.includes("microsoft-standard");
	} catch {
		return false;
	}
}
/** Asynchronously detects WSL from env vars and `/proc/sys/kernel/osrelease`, with process cache. */
async function isWSL() {
	if (wslCached !== null) return wslCached;
	if (process.platform !== "linux") {
		wslCached = false;
		return wslCached;
	}
	if (isWSLEnv()) {
		wslCached = true;
		return wslCached;
	}
	try {
		const release = (0, _gabrielvfonseca_normalization_core_string_coerce.normalizeLowercaseStringOrEmpty)(await node_fs_promises.default.readFile("/proc/sys/kernel/osrelease", "utf8"));
		wslCached = release.includes("microsoft") || release.includes("wsl");
	} catch {
		wslCached = false;
	}
	return wslCached;
}
//#endregion
//#region src/infra/net/undici-family-policy.ts
const AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS = 300;
/** Resolves the process default autoSelectFamily policy, with WSL2 forced to IPv4. */
function resolveUndiciAutoSelectFamily() {
	if (typeof node_net.getDefaultAutoSelectFamily !== "function") return;
	try {
		const systemDefault = node_net.getDefaultAutoSelectFamily();
		if (systemDefault && isWSL2Sync()) return false;
		return systemDefault;
	} catch {
		return;
	}
}
/** Converts an autoSelectFamily decision into the undici connect option shape. */
function createUndiciAutoSelectFamilyConnectOptions(autoSelectFamily) {
	if (autoSelectFamily === void 0) return;
	return {
		autoSelectFamily,
		autoSelectFamilyAttemptTimeout: AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS
	};
}
/** Returns shared undici connect options for dispatchers that do not override them. */
function resolveUndiciAutoSelectFamilyConnectOptions() {
	return createUndiciAutoSelectFamilyConnectOptions(resolveUndiciAutoSelectFamily());
}
/**
* Temporarily applies an undici family decision around synchronous setup code.
* Restore is best-effort because older Node runtimes may not expose the setters.
*/
function withTemporaryUndiciAutoSelectFamily(autoSelectFamily, run) {
	if (autoSelectFamily === void 0 || typeof node_net.getDefaultAutoSelectFamily !== "function" || typeof node_net.setDefaultAutoSelectFamily !== "function") return run();
	let previous;
	try {
		previous = node_net.getDefaultAutoSelectFamily();
		node_net.setDefaultAutoSelectFamily(autoSelectFamily);
	} catch {
		return run();
	}
	try {
		return run();
	} finally {
		try {
			node_net.setDefaultAutoSelectFamily(previous);
		} catch {}
	}
}
//#endregion
//#region src/infra/net/undici-runtime.ts
const TEST_UNDICI_RUNTIME_DEPS_KEY = "__OPERATOR_TEST_UNDICI_RUNTIME_DEPS__";
const requireUndici = (0, node_module.createRequire)(require("url").pathToFileURL(__filename).href);
const HTTP1_ONLY_DISPATCHER_OPTIONS$1 = Object.freeze({ allowH2: false });
function applyMissingConnectOptions(connect, defaults) {
	for (const [key, value] of Object.entries(defaults)) if (!(key in connect)) connect[key] = value;
}
function loadUndiciModule(requiredExports) {
	const override = globalThis[TEST_UNDICI_RUNTIME_DEPS_KEY];
	if ((0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(override) && requiredExports.every((key) => typeof override[key] === "function")) return override;
	return requireUndici("undici");
}
function stripIpServernameFromConnectOptions(options) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(options) || typeof options.servername !== "string") return options;
	const servername = options.servername.replace(/^\[|\]$/g, "");
	if (node_net.default.isIP(servername) === 0) return options;
	const next = { ...options };
	delete next.servername;
	return next;
}
function stripIpServernameFromConnect(connect) {
	if (typeof connect !== "function") return connect;
	return (options, callback) => connect(stripIpServernameFromConnectOptions(options), callback);
}
function createIpSafeProxyClientFactory() {
	return (origin, options) => {
		const { Pool } = loadUndiciModule(["Pool"]);
		return new Pool(origin, (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(options) ? {
			...options,
			connect: stripIpServernameFromConnect(options.connect)
		} : options);
	};
}
function addIpSafeProxyClientFactory(options) {
	if ("clientFactory" in options) return options;
	return {
		...options,
		clientFactory: createIpSafeProxyClientFactory()
	};
}
/** Loads undici lazily, allowing tests to inject constructors without global side effects. */
function loadUndiciRuntimeDeps() {
	return loadUndiciModule([
		"Agent",
		"EnvHttpProxyAgent",
		"ProxyAgent",
		"fetch"
	]);
}
/** Loads only the undici global-dispatcher API used by startup proxy setup. */
function loadUndiciGlobalDispatcherDeps() {
	return loadUndiciModule([
		"Agent",
		"EnvHttpProxyAgent",
		"getGlobalDispatcher",
		"setGlobalDispatcher"
	]);
}
function withHttp1OnlyDispatcherOptions(options, timeoutMs, applyTo) {
	const base = {};
	if (options) Object.assign(base, options);
	Object.assign(base, HTTP1_ONLY_DISPATCHER_OPTIONS$1);
	const baseRecord = base;
	const targets = applyTo ?? { connect: true };
	const autoSelectConnect = resolveUndiciAutoSelectFamilyConnectOptions();
	if (autoSelectConnect && targets.connect && typeof baseRecord.connect !== "function") {
		const connect = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(baseRecord.connect) ? baseRecord.connect : {};
		applyMissingConnectOptions(connect, autoSelectConnect);
		baseRecord.connect = connect;
	}
	if (autoSelectConnect && targets.proxyTls) {
		const proxyTls = (0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(baseRecord.proxyTls) ? baseRecord.proxyTls : {};
		applyMissingConnectOptions(proxyTls, autoSelectConnect);
		baseRecord.proxyTls = proxyTls;
	}
	if (timeoutMs !== void 0 && Number.isFinite(timeoutMs) && timeoutMs > 0) {
		const normalizedTimeoutMs = Math.floor(timeoutMs);
		baseRecord.bodyTimeout = normalizedTimeoutMs;
		baseRecord.headersTimeout = normalizedTimeoutMs;
		if (targets.connect && typeof baseRecord.connect !== "function") baseRecord.connect = {
			...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(baseRecord.connect) ? baseRecord.connect : {},
			timeout: normalizedTimeoutMs
		};
		if (targets.proxyTls) baseRecord.proxyTls = {
			...(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(baseRecord.proxyTls) ? baseRecord.proxyTls : {},
			timeout: normalizedTimeoutMs
		};
	}
	return base;
}
/** Creates a direct undici Agent with Operator's HTTP/1-only dispatcher policy. */
function createHttp1Agent(options, timeoutMs) {
	const { Agent } = loadUndiciRuntimeDeps();
	return new Agent(withHttp1OnlyDispatcherOptions(options, timeoutMs));
}
/**
* Creates an EnvHttpProxyAgent with Operator proxy TLS, IP-safe proxy pools,
* timeout propagation, and HTTP/1-only dispatch.
*/
function createHttp1EnvHttpProxyAgent(options, timeoutMs) {
	const { EnvHttpProxyAgent } = loadUndiciRuntimeDeps();
	return new EnvHttpProxyAgent(withHttp1OnlyDispatcherOptions(addIpSafeProxyClientFactory(addActiveManagedProxyTlsOptions(options) ?? {}), timeoutMs, {
		connect: true,
		proxyTls: true
	}));
}
/**
* Creates a fixed ProxyAgent with the same HTTP/1, managed TLS, timeout, and
* IP-safe proxy connection policy used by env proxy dispatchers.
*/
function createHttp1ProxyAgent(options, timeoutMs) {
	const { ProxyAgent } = loadUndiciRuntimeDeps();
	return new ProxyAgent(withHttp1OnlyDispatcherOptions(addIpSafeProxyClientFactory(addActiveManagedProxyTlsOptions(typeof options === "string" || options instanceof URL ? { uri: options.toString() } : { ...options })), timeoutMs, { proxyTls: true }));
}
//#endregion
//#region src/infra/net/undici-global-dispatcher.ts
const DEFAULT_UNDICI_STREAM_TIMEOUT_MS = 1800 * 1e3;
const HTTP1_ONLY_DISPATCHER_OPTIONS = Object.freeze({ allowH2: false });
/**
* Module-level bridge so `resolveDispatcherTimeoutMs` in fetch-guard.ts
* can read the global dispatcher timeout without relying on Undici's
* non-public `.options` field.
*/
let globalUndiciStreamTimeoutMs;
let lastAppliedTimeoutKey = null;
let lastAppliedProxyBootstrapKey = null;
const UNDICI_DISPATCH_HELPER_METHODS = /* @__PURE__ */ new Set([
	"compose",
	"connect",
	"pipeline",
	"request",
	"stream",
	"upgrade"
]);
const UNDICI_DISPATCHER_LIFECYCLE_METHODS = /* @__PURE__ */ new Set(["close", "destroy"]);
const timedProxylineManagedDispatchers = /* @__PURE__ */ new WeakMap();
function isTimedProxylineManagedDispatcher(dispatcher) {
	return typeof dispatcher === "object" && dispatcher !== null ? timedProxylineManagedDispatchers.has(dispatcher) : false;
}
function withDefaultDispatchTimeout(timeout, timeoutMs) {
	return timeout == null ? timeoutMs : timeout;
}
function createTimedProxylineManagedDispatcher(dispatcher, timeoutMs, autoSelectFamily) {
	const existingState = timedProxylineManagedDispatchers.get(dispatcher);
	if (existingState) {
		existingState.autoSelectFamily = autoSelectFamily;
		existingState.timeoutMs = timeoutMs;
		return dispatcher;
	}
	const state = {
		autoSelectFamily,
		timeoutMs,
		dispatch(options, handler) {
			return withTemporaryUndiciAutoSelectFamily(state.autoSelectFamily, () => dispatcher.dispatch({
				...options,
				bodyTimeout: withDefaultDispatchTimeout(options.bodyTimeout, state.timeoutMs),
				headersTimeout: withDefaultDispatchTimeout(options.headersTimeout, state.timeoutMs),
				...HTTP1_ONLY_DISPATCHER_OPTIONS
			}, handler));
		}
	};
	const proxy = new Proxy(dispatcher, { get(target, property, receiver) {
		if (property === "dispatch") return state.dispatch;
		const value = Reflect.get(target, property, receiver);
		if (typeof value !== "function") return value;
		if (UNDICI_DISPATCHER_LIFECYCLE_METHODS.has(property)) return value.bind(target);
		if (UNDICI_DISPATCH_HELPER_METHODS.has(property)) return (...args) => Reflect.apply(value, receiver, args);
		return value;
	} });
	timedProxylineManagedDispatchers.set(proxy, state);
	return proxy;
}
function resolveDispatcherKind(dispatcher) {
	const ctorName = dispatcher?.constructor?.name;
	if (typeof ctorName !== "string" || ctorName.length === 0) return "unsupported";
	if (ctorName.includes("EnvHttpProxyAgent")) return "env-proxy";
	if (isTimedProxylineManagedDispatcher(dispatcher) || (0, _openclaw_proxyline_dispatcher_brand.isProxylineDispatcher)(dispatcher)) return "proxyline-managed";
	if (ctorName.includes("ProxyAgent")) return "unsupported";
	if (ctorName.includes("Agent")) return "agent";
	return "unsupported";
}
function resolveDispatcherKey(params) {
	const autoSelectToken = params.autoSelectFamily === void 0 ? "na" : params.autoSelectFamily ? "on" : "off";
	return `${params.kind}:${params.timeoutMs}:${autoSelectToken}`;
}
function resolveEnvProxyDispatcherOptions() {
	return {
		...addActiveManagedProxyTlsOptions(resolveEnvHttpProxyAgentOptions()),
		...HTTP1_ONLY_DISPATCHER_OPTIONS
	};
}
function resolveEnvProxyBootstrapKey(options) {
	const entries = Object.entries(options ?? {}).filter(([, value]) => value !== void 0).toSorted(([a], [b]) => a.localeCompare(b));
	return JSON.stringify(entries);
}
function resolveStreamTimeoutMs(opts) {
	const timeoutMsRaw = opts?.timeoutMs ?? 18e5;
	if (!Number.isFinite(timeoutMsRaw)) return null;
	return Math.max(DEFAULT_UNDICI_STREAM_TIMEOUT_MS, Math.floor(timeoutMsRaw));
}
function resolveCurrentDispatcherKind(runtime) {
	return resolveCurrentDispatcherInfo(runtime)?.kind ?? null;
}
function resolveCurrentDispatcherInfo(runtime) {
	let dispatcher;
	try {
		dispatcher = runtime.getGlobalDispatcher();
	} catch {
		return null;
	}
	const currentKind = resolveDispatcherKind(dispatcher);
	if (currentKind === "unsupported") return null;
	return {
		kind: currentKind,
		dispatcher
	};
}
/** Installs the env-proxy global dispatcher once proxy env is available. */
function ensureGlobalUndiciEnvProxyDispatcher() {
	if (!hasEnvHttpProxyAgentConfigured()) return;
	const runtime = loadUndiciGlobalDispatcherDeps();
	const { setGlobalDispatcher } = runtime;
	const proxyOptions = resolveEnvProxyDispatcherOptions();
	const nextBootstrapKey = resolveEnvProxyBootstrapKey(proxyOptions);
	const currentKind = resolveCurrentDispatcherKind(runtime);
	if (currentKind === null) return;
	if (currentKind === "proxyline-managed") {
		lastAppliedProxyBootstrapKey = nextBootstrapKey;
		return;
	}
	if (currentKind === "env-proxy" && lastAppliedProxyBootstrapKey === null) {
		lastAppliedProxyBootstrapKey = nextBootstrapKey;
		return;
	}
	if (currentKind === "env-proxy" && lastAppliedProxyBootstrapKey === nextBootstrapKey) return;
	try {
		setGlobalDispatcher(createHttp1EnvHttpProxyAgent(proxyOptions));
		lastAppliedProxyBootstrapKey = nextBootstrapKey;
	} catch {}
}
function applyGlobalDispatcherStreamTimeouts(params) {
	const { runtime, dispatcher, kind, timeoutMs } = params;
	const autoSelectFamily = resolveUndiciAutoSelectFamily();
	const nextKey = resolveDispatcherKey({
		kind,
		timeoutMs,
		autoSelectFamily
	});
	const needsProxylineWrapper = kind === "proxyline-managed" && !isTimedProxylineManagedDispatcher(dispatcher);
	if (lastAppliedTimeoutKey === nextKey && !needsProxylineWrapper) return;
	const connect = createUndiciAutoSelectFamilyConnectOptions(autoSelectFamily);
	try {
		if (kind === "proxyline-managed") runtime.setGlobalDispatcher(createTimedProxylineManagedDispatcher(dispatcher, timeoutMs, autoSelectFamily));
		else if (kind === "env-proxy") {
			const proxyOptions = {
				...addActiveManagedProxyTlsOptions(resolveEnvHttpProxyAgentOptions()),
				bodyTimeout: timeoutMs,
				headersTimeout: timeoutMs,
				...connect ? { connect } : {},
				...HTTP1_ONLY_DISPATCHER_OPTIONS
			};
			runtime.setGlobalDispatcher(createHttp1EnvHttpProxyAgent(proxyOptions, timeoutMs));
		} else runtime.setGlobalDispatcher(createHttp1Agent(connect ? { connect } : void 0, timeoutMs));
		lastAppliedTimeoutKey = nextKey;
	} catch {}
}
/** Forces timeout/family policy onto the current supported global dispatcher. */
function ensureGlobalUndiciDispatcherStreamTimeouts(opts) {
	const timeoutMs = resolveStreamTimeoutMs(opts);
	if (timeoutMs === null) return;
	globalUndiciStreamTimeoutMs = timeoutMs;
	const runtime = loadUndiciGlobalDispatcherDeps();
	const current = resolveCurrentDispatcherInfo(runtime);
	if (current === null) return;
	applyGlobalDispatcherStreamTimeouts({
		runtime,
		dispatcher: current.dispatcher,
		kind: current.kind,
		timeoutMs
	});
}
/**
* Re-evaluate proxy env changes for root undici imports. Installs
* EnvHttpProxyAgent when proxy env is present, and restores a direct Agent
* after proxy env is cleared.
*/
function forceResetGlobalDispatcher(opts) {
	lastAppliedTimeoutKey = null;
	if (!hasEnvHttpProxyAgentConfigured()) {
		if (lastAppliedProxyBootstrapKey === null) return;
		lastAppliedProxyBootstrapKey = null;
		try {
			const { setGlobalDispatcher } = loadUndiciGlobalDispatcherDeps();
			setGlobalDispatcher(createHttp1Agent());
		} catch {}
		return;
	}
	try {
		const runtime = loadUndiciGlobalDispatcherDeps();
		const { setGlobalDispatcher } = runtime;
		const proxyOptions = resolveEnvProxyDispatcherOptions();
		if (opts?.preserveProxylineManaged) {
			if (resolveCurrentDispatcherInfo(runtime)?.kind === "proxyline-managed") {
				lastAppliedProxyBootstrapKey = resolveEnvProxyBootstrapKey(proxyOptions);
				return;
			}
		}
		setGlobalDispatcher(createHttp1EnvHttpProxyAgent(proxyOptions));
		lastAppliedProxyBootstrapKey = resolveEnvProxyBootstrapKey(proxyOptions);
	} catch {}
}
//#endregion
Object.defineProperty(exports, "DEFAULT_UNDICI_STREAM_TIMEOUT_MS", {
	enumerable: true,
	get: function() {
		return DEFAULT_UNDICI_STREAM_TIMEOUT_MS;
	}
});
Object.defineProperty(exports, "createHttp1Agent", {
	enumerable: true,
	get: function() {
		return createHttp1Agent;
	}
});
Object.defineProperty(exports, "createHttp1EnvHttpProxyAgent", {
	enumerable: true,
	get: function() {
		return createHttp1EnvHttpProxyAgent;
	}
});
Object.defineProperty(exports, "createHttp1ProxyAgent", {
	enumerable: true,
	get: function() {
		return createHttp1ProxyAgent;
	}
});
Object.defineProperty(exports, "ensureGlobalUndiciDispatcherStreamTimeouts", {
	enumerable: true,
	get: function() {
		return ensureGlobalUndiciDispatcherStreamTimeouts;
	}
});
Object.defineProperty(exports, "ensureGlobalUndiciEnvProxyDispatcher", {
	enumerable: true,
	get: function() {
		return ensureGlobalUndiciEnvProxyDispatcher;
	}
});
Object.defineProperty(exports, "forceResetGlobalDispatcher", {
	enumerable: true,
	get: function() {
		return forceResetGlobalDispatcher;
	}
});
Object.defineProperty(exports, "globalUndiciStreamTimeoutMs", {
	enumerable: true,
	get: function() {
		return globalUndiciStreamTimeoutMs;
	}
});
Object.defineProperty(exports, "isWSL", {
	enumerable: true,
	get: function() {
		return isWSL;
	}
});
Object.defineProperty(exports, "isWSL2Sync", {
	enumerable: true,
	get: function() {
		return isWSL2Sync;
	}
});
Object.defineProperty(exports, "isWSLEnv", {
	enumerable: true,
	get: function() {
		return isWSLEnv;
	}
});
Object.defineProperty(exports, "loadManagedProxyTlsOptionsSync", {
	enumerable: true,
	get: function() {
		return loadManagedProxyTlsOptionsSync;
	}
});
Object.defineProperty(exports, "loadUndiciRuntimeDeps", {
	enumerable: true,
	get: function() {
		return loadUndiciRuntimeDeps;
	}
});
Object.defineProperty(exports, "matchesNoProxy", {
	enumerable: true,
	get: function() {
		return matchesNoProxy;
	}
});
Object.defineProperty(exports, "resolveActiveManagedProxyTlsOptions", {
	enumerable: true,
	get: function() {
		return resolveActiveManagedProxyTlsOptions;
	}
});
Object.defineProperty(exports, "resolveEnvHttpProxyAgentOptions", {
	enumerable: true,
	get: function() {
		return resolveEnvHttpProxyAgentOptions;
	}
});
Object.defineProperty(exports, "resolveManagedEnvHttpProxyAgentOptions", {
	enumerable: true,
	get: function() {
		return resolveManagedEnvHttpProxyAgentOptions;
	}
});
Object.defineProperty(exports, "resolveManagedProxyCaFileForUrl", {
	enumerable: true,
	get: function() {
		return resolveManagedProxyCaFileForUrl;
	}
});
Object.defineProperty(exports, "shouldUseEnvHttpProxyForUrl", {
	enumerable: true,
	get: function() {
		return shouldUseEnvHttpProxyForUrl;
	}
});
