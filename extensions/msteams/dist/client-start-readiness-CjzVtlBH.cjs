const require_rolldown_runtime = require("./rolldown-runtime-u92d-OFm.cjs");
const require_paths = require("./paths-C5Qy0ueD.cjs");
const require_redact = require("./redact-Bg-yc44I.cjs");
const require_logger = require("./logger-DFfd_p65.cjs");
const require_version = require("./version-B8VHpWoT.cjs");
const require_timeouts = require("./timeouts-CU8hB3Uw.cjs");
const require_active_proxy_state = require("./active-proxy-state-IFfwIaiY.cjs");
const require_undici_global_dispatcher = require("./undici-global-dispatcher-DdF4yxgq.cjs");
const require_private_file_store = require("./private-file-store-C0DdQCy-.cjs");
const require_src = require("./src-Bt6t_5vk.cjs");
const require_device_auth = require("./device-auth-Bt1d1HUq.cjs");
const require_device_identity = require("./device-identity-C6ZGDbLx.cjs");
const require_fingerprint = require("./fingerprint-BsHRaMlI.cjs");
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let _gabrielvfonseca_normalization_core_record_coerce = require("@gabrielvfonseca/normalization-core/record-coerce");
let _gabrielvfonseca_net_policy_ip = require("@gabrielvfonseca/net-policy/ip");
let _gabrielvfonseca_net_policy_url_protocol = require("@gabrielvfonseca/net-policy/url-protocol");
let _openclaw_proxyline = require("@openclaw/proxyline");
//#region packages/gateway-client/src/event-loop-ready.ts
const DEFAULT_MAX_WAIT_MS = 1e4;
const DEFAULT_INTERVAL_MS = 1;
const DEFAULT_DRIFT_THRESHOLD_MS = 200;
const DEFAULT_CONSECUTIVE_READY_CHECKS = 2;
function resolvePositiveInteger(value, fallback) {
	return Number.isFinite(value) && value !== void 0 ? Math.max(1, Math.floor(value)) : fallback;
}
/** Waits until timer drift stays low for consecutive checks, or aborts/times out. */
async function waitForEventLoopReady(options = {}) {
	const maxWaitMs = require_timeouts.resolveFiniteTimeoutDelayMs(options.maxWaitMs, DEFAULT_MAX_WAIT_MS, { minMs: 0 });
	const intervalMs = require_timeouts.resolveFiniteTimeoutDelayMs(options.intervalMs, DEFAULT_INTERVAL_MS);
	const driftThresholdMs = resolvePositiveInteger(options.driftThresholdMs, DEFAULT_DRIFT_THRESHOLD_MS);
	const consecutiveReadyChecks = resolvePositiveInteger(options.consecutiveReadyChecks, DEFAULT_CONSECUTIVE_READY_CHECKS);
	const signal = options.signal;
	const startedAt = Date.now();
	let readyChecks = 0;
	let checks = 0;
	let maxDriftMs = 0;
	return await new Promise((resolve) => {
		let settled = false;
		let timer = null;
		const clearTimer = () => {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		};
		const finish = (ready, aborted = false) => {
			if (settled) return;
			settled = true;
			clearTimer();
			signal?.removeEventListener("abort", onAbort);
			resolve({
				ready,
				elapsedMs: Math.max(0, Date.now() - startedAt),
				maxDriftMs,
				checks,
				aborted
			});
		};
		const onAbort = () => {
			finish(false, true);
		};
		if (signal?.aborted) {
			finish(false, true);
			return;
		}
		signal?.addEventListener("abort", onAbort, { once: true });
		const scheduleNext = () => {
			if (signal?.aborted) {
				finish(false, true);
				return;
			}
			const elapsedMs = Math.max(0, Date.now() - startedAt);
			const remainingMs = maxWaitMs - elapsedMs;
			if (remainingMs <= 0) {
				finish(false);
				return;
			}
			const delayMs = Math.min(intervalMs, remainingMs);
			const scheduledAt = Date.now();
			timer = setTimeout(() => {
				timer = null;
				checks += 1;
				const driftMs = Math.max(0, Date.now() - scheduledAt - delayMs);
				maxDriftMs = Math.max(maxDriftMs, driftMs);
				if (driftMs > driftThresholdMs) readyChecks = 0;
				else readyChecks += 1;
				if (readyChecks >= consecutiveReadyChecks) {
					finish(true);
					return;
				}
				scheduleNext();
			}, delayMs);
		};
		scheduleNext();
	});
}
//#endregion
//#region packages/gateway-client/src/readiness.ts
function resolveGatewayClientStartReadinessTimeoutMs(options = {}) {
	if (typeof options.timeoutMs === "number" && Number.isFinite(options.timeoutMs)) return options.timeoutMs;
	const clientOptions = options.clientOptions ?? {};
	return require_timeouts.resolveConnectChallengeTimeoutMs(typeof clientOptions.connectChallengeTimeoutMs === "number" && Number.isFinite(clientOptions.connectChallengeTimeoutMs) ? clientOptions.connectChallengeTimeoutMs : void 0, {
		env: clientOptions.env,
		configuredTimeoutMs: clientOptions.preauthHandshakeTimeoutMs
	});
}
/** Starts a gateway client only after the supplied readiness probe succeeds. */
async function startGatewayClientWithReadinessWait(waitForReady, client, options = {}) {
	const readiness = await waitForReady({
		maxWaitMs: resolveGatewayClientStartReadinessTimeoutMs(options),
		signal: options.signal
	});
	if (readiness.ready && !readiness.aborted && options.signal?.aborted !== true) client.start();
	return readiness;
}
//#endregion
//#region src/shared/device-auth-store.ts
function coerceDeviceAuthEntry(role, value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || typeof value.token !== "string") return null;
	const updatedAtMs = typeof value.updatedAtMs === "number" && Number.isFinite(value.updatedAtMs) ? value.updatedAtMs : 0;
	return {
		token: value.token,
		role,
		scopes: require_device_auth.normalizeDeviceAuthScopes(Array.isArray(value.scopes) ? value.scopes : void 0),
		updatedAtMs
	};
}
function copyCanonicalDeviceAuthTokens(tokens) {
	const out = {};
	for (const [rawRole, value] of Object.entries(tokens)) {
		const role = require_device_auth.normalizeDeviceAuthRole(rawRole);
		if (!role) continue;
		const entry = coerceDeviceAuthEntry(role, value);
		if (entry) out[role] = entry;
	}
	return out;
}
/** Coerces raw persisted device-auth JSON into the current canonical store shape. */
function coerceDeviceAuthStore(value) {
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value) || value.version !== 1 || typeof value.deviceId !== "string") return null;
	if (!(0, _gabrielvfonseca_normalization_core_record_coerce.isRecord)(value.tokens)) return null;
	return {
		version: 1,
		deviceId: value.deviceId,
		tokens: copyCanonicalDeviceAuthTokens(value.tokens)
	};
}
/** Load one normalized role token, ignoring stores bound to a different gateway device id. */
function loadDeviceAuthTokenFromStore(params) {
	const store = params.adapter.readStore();
	if (!store || store.deviceId !== params.deviceId) return null;
	const role = require_device_auth.normalizeDeviceAuthRole(params.role);
	return coerceDeviceAuthEntry(role, store.tokens[role]);
}
/** Store one role token while preserving canonical tokens for the same gateway device id. */
function storeDeviceAuthTokenInStore(params) {
	const role = require_device_auth.normalizeDeviceAuthRole(params.role);
	const existing = params.adapter.readStore();
	const next = {
		version: 1,
		deviceId: params.deviceId,
		tokens: existing && existing.deviceId === params.deviceId && existing.tokens ? copyCanonicalDeviceAuthTokens(existing.tokens) : {}
	};
	const entry = {
		token: params.token,
		role,
		scopes: require_device_auth.normalizeDeviceAuthScopes(params.scopes),
		updatedAtMs: Date.now()
	};
	next.tokens[role] = entry;
	params.adapter.writeStore(next);
	return entry;
}
/** Clear one normalized role token without rewriting missing or wrong-device stores. */
function clearDeviceAuthTokenFromStore(params) {
	const store = params.adapter.readStore();
	if (!store || store.deviceId !== params.deviceId) return;
	const role = require_device_auth.normalizeDeviceAuthRole(params.role);
	if (!store.tokens[role]) return;
	const next = {
		version: 1,
		deviceId: store.deviceId,
		tokens: copyCanonicalDeviceAuthTokens(store.tokens)
	};
	delete next.tokens[role];
	params.adapter.writeStore(next);
}
//#endregion
//#region src/infra/device-auth-store.ts
const DEVICE_AUTH_FILE = "device-auth.json";
const storeReadCache = /* @__PURE__ */ new Map();
function storeCacheHit(cached, stat) {
	return cached !== void 0 && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size;
}
function resolveDeviceAuthPath(env = process.env) {
	return node_path.default.join(require_paths.resolveStateDir(env), "identity", DEVICE_AUTH_FILE);
}
function readStore(filePath) {
	try {
		let stat = null;
		try {
			stat = node_fs.default.statSync(filePath);
		} catch {
			const cached = storeReadCache.get(filePath);
			if (cached?.mtimeMs === -1 && cached.size === -1) return cached.store;
			storeReadCache.set(filePath, {
				store: null,
				mtimeMs: -1,
				size: -1
			});
			return null;
		}
		const cached = storeReadCache.get(filePath);
		if (cached !== void 0 && storeCacheHit(cached, stat)) return cached.store;
		const store = coerceDeviceAuthStore(require_private_file_store.privateFileStoreSync(node_path.default.dirname(filePath)).readJsonIfExists(node_path.default.basename(filePath)));
		storeReadCache.set(filePath, {
			store,
			mtimeMs: stat.mtimeMs,
			size: stat.size
		});
		return store;
	} catch {
		return null;
	}
}
function writeStore(filePath, store) {
	require_private_file_store.privateFileStoreSync(node_path.default.dirname(filePath)).writeJson(node_path.default.basename(filePath), store, { trailingNewline: true });
	try {
		const stat = node_fs.default.statSync(filePath);
		storeReadCache.set(filePath, {
			store,
			mtimeMs: stat.mtimeMs,
			size: stat.size
		});
	} catch {
		storeReadCache.delete(filePath);
	}
}
/** Load a cached device-auth token from the configured Operator state directory. */
function loadDeviceAuthToken(params) {
	const filePath = resolveDeviceAuthPath(params.env);
	return loadDeviceAuthTokenFromStore({
		adapter: {
			readStore: () => readStore(filePath),
			writeStore: (_store) => {}
		},
		deviceId: params.deviceId,
		role: params.role
	});
}
/** Persist or replace one device-auth role token in the private state directory. */
function storeDeviceAuthToken(params) {
	const filePath = resolveDeviceAuthPath(params.env);
	return storeDeviceAuthTokenInStore({
		adapter: {
			readStore: () => readStore(filePath),
			writeStore: (store) => writeStore(filePath, store)
		},
		deviceId: params.deviceId,
		role: params.role,
		token: params.token,
		scopes: params.scopes
	});
}
/** Remove one role token for the current gateway device from the private state directory. */
function clearDeviceAuthToken(params) {
	const filePath = resolveDeviceAuthPath(params.env);
	clearDeviceAuthTokenFromStore({
		adapter: {
			readStore: () => readStore(filePath),
			writeStore: (store) => writeStore(filePath, store)
		},
		deviceId: params.deviceId,
		role: params.role
	});
}
//#endregion
//#region src/infra/net/proxy/proxy-lifecycle.ts
const PROXY_ENV_KEYS = [
	"http_proxy",
	"https_proxy",
	"HTTP_PROXY",
	"HTTPS_PROXY"
];
const NO_PROXY_ENV_KEYS = ["no_proxy", "NO_PROXY"];
const PROXY_ACTIVE_KEYS = [
	"OPERATOR_PROXY_ACTIVE",
	"OPERATOR_PROXY_LOOPBACK_MODE",
	"OPERATOR_PROXY_CA_FILE"
];
[
	...PROXY_ENV_KEYS,
	...NO_PROXY_ENV_KEYS,
	...PROXY_ACTIVE_KEYS
];
let proxylineHandle = null;
const MANAGED_PROXY_UNDICI_OPTIONS = Object.freeze({ allowH2: false });
/** Reinstalls Proxyline routing in child processes that inherited active proxy env. */
function ensureInheritedManagedProxyRoutingActive() {
	if (process.env["OPERATOR_PROXY_ACTIVE"] !== "1") return;
	const proxyUrl = process.env["HTTP_PROXY"];
	if (!proxyUrl || !(0, _gabrielvfonseca_net_policy_url_protocol.isHttpUrl)(proxyUrl)) return;
	const proxyTls = require_undici_global_dispatcher.loadManagedProxyTlsOptionsSync(require_undici_global_dispatcher.resolveManagedProxyCaFileForUrl({
		proxyUrl,
		caFileOverride: process.env["OPERATOR_PROXY_CA_FILE"]
	}));
	proxylineHandle = (0, _openclaw_proxyline.installGlobalProxy)({
		mode: "managed",
		proxyUrl,
		...proxyTls ? { proxyTls } : {},
		ifActive: "reuse-compatible",
		undici: MANAGED_PROXY_UNDICI_OPTIONS
	});
	require_undici_global_dispatcher.forceResetGlobalDispatcher({ preserveProxylineManaged: true });
}
function parseGatewayControlPlaneUrl(value) {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}
function getGatewayControlPlaneBypassAuthority(value) {
	const url = parseGatewayControlPlaneUrl(value);
	if (url === null || !(0, _gabrielvfonseca_net_policy_url_protocol.isHttpUrl)(url) && !(0, _gabrielvfonseca_net_policy_url_protocol.isWebSocketUrl)(url) || !isGatewayControlPlaneLoopbackHost(url.hostname)) return null;
	return url.port ? `${url.hostname}:${url.port}` : url.hostname;
}
/** Registers a temporary direct route for trusted Gateway loopback control-plane URLs. */
function registerManagedProxyGatewayLoopbackBypass(url) {
	if (!getGatewayControlPlaneBypassAuthority(url)) return;
	const loopbackMode = require_active_proxy_state.getActiveManagedProxyLoopbackMode();
	if (loopbackMode === "block") throw new Error("proxy: Gateway loopback control-plane connections are blocked by proxy.loopbackMode");
	if (loopbackMode === "proxy") return;
	return proxylineHandle?.registerBypass({ url });
}
function isGatewayControlPlaneLoopbackHost(hostname) {
	return hostname.trim().toLowerCase().replace(/\.+$/, "") === "localhost" || (0, _gabrielvfonseca_net_policy_ip.isLoopbackIpAddress)(hostname);
}
//#endregion
//#region src/gateway/client.ts
function createOperatorGatewayClientHostDeps(overrides) {
	return {
		loadOrCreateDeviceIdentity: require_device_identity.loadOrCreateDeviceIdentity,
		signDevicePayload: require_device_identity.signDevicePayload,
		publicKeyRawBase64UrlFromPem: require_device_identity.publicKeyRawBase64UrlFromPem,
		loadDeviceAuthToken,
		storeDeviceAuthToken,
		clearDeviceAuthToken,
		beforeConnect: ensureInheritedManagedProxyRoutingActive,
		registerGatewayLoopbackBypass: registerManagedProxyGatewayLoopbackBypass,
		normalizeTlsFingerprint: (fingerprint) => require_fingerprint.normalizeFingerprint(fingerprint ?? ""),
		logDebug: require_logger.logDebug,
		logError: require_logger.logError,
		redactForLog: require_redact.redactToolPayloadText,
		...overrides
	};
}
var GatewayClient = class {
	#client;
	constructor(opts) {
		this.#client = new require_src.GatewayClient({
			...opts,
			clientVersion: opts.clientVersion ?? require_version.VERSION,
			hostDeps: createOperatorGatewayClientHostDeps(opts.hostDeps)
		});
	}
	start() {
		this.#client.start();
	}
	stop() {
		this.#client.stop();
	}
	stopAndWait(opts) {
		return this.#client.stopAndWait(opts);
	}
	request(method, params, opts) {
		return this.#client.request(method, params, opts);
	}
	getConnectionMetadata() {
		return this.#client.getConnectionMetadata();
	}
	updateNodeManifest(manifest) {
		this.#client.updateNodeManifest(manifest);
	}
};
//#endregion
//#region src/gateway/client-start-readiness.ts
/** Starts a gateway client once the shared event-loop readiness check passes. */
function startGatewayClientWhenEventLoopReady(client, options = {}) {
	return startGatewayClientWithReadinessWait(waitForEventLoopReady, client, options);
}
//#endregion
Object.defineProperty(exports, "GatewayClient", {
	enumerable: true,
	get: function() {
		return GatewayClient;
	}
});
Object.defineProperty(exports, "loadDeviceAuthToken", {
	enumerable: true,
	get: function() {
		return loadDeviceAuthToken;
	}
});
Object.defineProperty(exports, "startGatewayClientWhenEventLoopReady", {
	enumerable: true,
	get: function() {
		return startGatewayClientWhenEventLoopReady;
	}
});
